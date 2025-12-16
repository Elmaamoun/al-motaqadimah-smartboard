import React, { useState, useEffect, useRef } from 'react';
import { Clock, Maximize, Minimize, Volume2, VolumeX, LogOut, X, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import clsx from 'clsx';

export const TopBar: React.FC = () => {
    const { endSession, isSoundEnabled, toggleSound } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Timer State
    const [initialSeconds, setInitialSeconds] = useState<number>(40 * 60);
    const [remainingSeconds, setRemainingSeconds] = useState<number>(40 * 60);
    const [isRunning, setIsRunning] = useState(false);

    const [showTimerSettings, setShowTimerSettings] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const [showTimeUpBanner, setShowTimeUpBanner] = useState(false);

    // Settings Menu State
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    // Audio Refs
    const alertSoundRef = useRef<HTMLAudioElement | null>(null);
    const alarmSoundRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const hasPlayedFiveMinAlert = useRef(false);


    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Fullscreen listener
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const initAudio = () => {
        if (!alertSoundRef.current) {
            alertSoundRef.current = new Audio('/sounds/alert.mp3');
            alarmSoundRef.current = new Audio('/sounds/alarm.mp3');
        }

        // Initialize Web Audio Context for Beep
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
            }
        }

        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(e => console.error("Audio resume failed", e));
        }
    };

    const playBeep = () => {
        try {
            if (!audioContextRef.current) initAudio();
            const ctx = audioContextRef.current;
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();

            const t = ctx.currentTime;

            // Oscillator 1: Fundamental (Sine) - Main Chime
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, t); // A5

            osc1.connect(gain1);
            gain1.connect(ctx.destination);

            gain1.gain.setValueAtTime(0, t);
            gain1.gain.linearRampToValueAtTime(0.5, t + 0.05); // Fast attack
            gain1.gain.exponentialRampToValueAtTime(0.01, t + 2.5); // Long Decay

            osc1.start(t);
            osc1.stop(t + 2.5);

            // Oscillator 2: Harmonic (Triangle) - Richness
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1760, t); // A6

            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            gain2.gain.setValueAtTime(0, t);
            gain2.gain.linearRampToValueAtTime(0.1, t + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

            osc2.start(t);
            osc2.stop(t + 2.5);

        } catch (e) {
            console.error("Beep failed", e);
        }
    };

    // Timer Ticker Effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isRunning && remainingSeconds > 0) {
            interval = setInterval(() => {
                setRemainingSeconds((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    // Timer Logic Effect (Alerts & Stop)
    useEffect(() => {
        if (remainingSeconds === 0 && isRunning) {
            setIsRunning(false);
            setShowTimeUpBanner(true);
            if (isSoundEnabled) alarmSoundRef.current?.play().catch(() => { });
        } else if (remainingSeconds === 300 && isRunning) { // 5 mins
            if (isSoundEnabled && !hasPlayedFiveMinAlert.current) {
                playBeep();
                hasPlayedFiveMinAlert.current = true;
            }
        } else if (remainingSeconds === 120 && isRunning) { // 2 mins
            if (isSoundEnabled) alarmSoundRef.current?.play().catch(() => { });
        }
    }, [remainingSeconds, isRunning, isSoundEnabled]);

    const startTimer = () => {
        initAudio(); // Safe to call multiple times
        if (remainingSeconds > 0) {
            setIsRunning(true);
            setShowTimerSettings(false); // Close popup on Start
        }
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setRemainingSeconds(initialSeconds);
        setShowTimeUpBanner(false);
        hasPlayedFiveMinAlert.current = false;
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimerSet = (minutes: number) => {
        const seconds = minutes * 60;
        setInitialSeconds(seconds);
        setRemainingSeconds(seconds);
        setIsRunning(false);
        setShowTimeUpBanner(false);
        hasPlayedFiveMinAlert.current = false;
        // Should NOT close popup
    };

    const handleCustomTimerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mins = parseInt(customMinutes);
        if (!isNaN(mins) && mins > 0) {
            handleTimerSet(mins);
            setCustomMinutes('');
        }
    };

    const getTimerColor = () => {
        if (remainingSeconds === 0) return 'text-red-600 animate-pulse';
        if (remainingSeconds < 120) return 'text-red-500 animate-pulse'; // Less than 2 mins
        if (remainingSeconds < 300) return 'text-orange-400'; // Less than 5 mins
        return 'text-white';
    };

    return (
        <>
            {/* Time Up Banner */}
            {showTimeUpBanner && (
                <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-[60] font-bold text-xl animate-bounce shadow-lg">
                    انتهى وقت الحصة
                    <button onClick={() => setShowTimeUpBanner(false)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            )}

            <div className="h-14 bg-primary-blue text-white flex items-center justify-between px-4 shadow-md z-50 relative">

                {/* Right Side: Logo & Title */}
                <div className="flex items-center gap-4">
                    <div className="font-bold text-xl tracking-wide">مدارس المتقدمة</div>
                    <div className="h-6 w-px bg-white/20 mx-2"></div>
                    <div className="text-sm opacity-90">{currentTime.toLocaleDateString('ar-SA-u-ca-islamic', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>

                {/* Center: Timer */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-4">
                    <div className="relative">
                        <div
                            className={clsx("text-3xl font-mono font-bold cursor-pointer flex items-center gap-2 transition-colors", getTimerColor())}
                            onClick={() => setShowTimerSettings(!showTimerSettings)}
                        >
                            <Clock size={24} />
                            {formatTime(remainingSeconds)}
                        </div>

                        {showTimerSettings && (
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-white text-gray-800 rounded-lg shadow-xl p-4 w-72 z-50 border border-gray-200">
                                {/* Controls */}
                                <div className="flex gap-2 mb-4 justify-center">
                                    <button
                                        onClick={isRunning ? pauseTimer : startTimer}
                                        className={clsx("p-3 rounded-full text-white shadow-md transition-transform active:scale-95", isRunning ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600")}
                                        title={isRunning ? "إيقاف مؤقت" : "بدء"}
                                    >
                                        {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    </button>
                                    <button
                                        onClick={resetTimer}
                                        className="p-3 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-md transition-transform active:scale-95"
                                        title="إعادة تعيين"
                                    >
                                        <RotateCcw size={24} />
                                    </button>
                                </div>

                                {/* Presets */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {[40, 35].map(mins => (
                                        <button
                                            key={mins}
                                            onClick={() => handleTimerSet(mins)}
                                            className="bg-blue-50 hover:bg-primary-blue hover:text-white py-2 rounded transition-colors font-bold border border-blue-100"
                                        >
                                            {mins} دقيقة
                                        </button>
                                    ))}
                                </div>

                                {/* Custom Input */}
                                <form onSubmit={handleCustomTimerSubmit} className="flex gap-2 border-t pt-4 border-gray-100">
                                    <input
                                        type="number"
                                        placeholder="دقيقة..."
                                        value={customMinutes}
                                        onChange={(e) => setCustomMinutes(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary-blue"
                                    />
                                    <button type="submit" className="bg-primary-blue text-white px-3 py-1 rounded text-sm whitespace-nowrap">تعيين</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Left Side: Controls */}
                <div className="flex items-center gap-3">

                    {/* Settings Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                        >
                            <Settings size={18} />
                            <span>إعدادات الحصة</span>
                        </button>

                        {showSettingsMenu && (
                            <div className="absolute top-full left-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl w-48 py-1 z-50 border border-gray-200">

                                <button
                                    onClick={() => { endSession(); setShowSettingsMenu(false); }}
                                    className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-100"
                                >
                                    <LogOut size={16} />
                                    <span>إنهاء الحصة</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-6 w-px bg-white/20 mx-1"></div>

                    <button onClick={toggleSound} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        {!isSoundEnabled ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                </div>
            </div>


        </>
    );
};
