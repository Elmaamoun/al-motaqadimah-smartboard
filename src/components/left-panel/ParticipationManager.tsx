import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Plus, Minus, X, Trash2, Crown, Edit2, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const POSITIVE_MESSAGES = ["أحسنت!", "رائع جداً!", "ممتاز!", "مبدع! استمر!"];
const NEUTRAL_MESSAGES = ["نذكّرك بالالتزام.", "يمكنك التحسن في المشاركة القادمة.", "سنرى منك الأفضل قريباً."];

export const ParticipationManager: React.FC = () => {
    const { students, addStudent, updateStudentPoints, groups, updateGroupPoints, isSoundEnabled, classStudents, updateGroupName, updateGroupLeader, deleteGroup, updateStudentName, deleteStudent, isEditLocked } = useApp();
    const [activeTab, setActiveTab] = useState<'individual' | 'group'>('individual');
    const { width: windowWidth, height: windowHeight } = useWindowSize();

    // Animation State
    // Animation State
    const [animatingId, setAnimatingId] = useState<string | null>(null);
    const [animationType, setAnimationType] = useState<'positive' | 'negative' | null>(null);
    const [messageQueue, setMessageQueue] = useState<Array<{ id: number, text: string, type: 'positive' | 'negative' }>>([]);
    // Message State with Exit Phase
    const [currentMessage, setCurrentMessage] = useState<{ id: number, text: string, type: 'positive' | 'negative' } | null>(null);
    const [isMessageExiting, setIsMessageExiting] = useState(false);
    const [animationKeys, setAnimationKeys] = useState<Record<string, number>>({});
    // Removed local isLocked state
    const animationTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Process Message Queue
    React.useEffect(() => {
        if (!currentMessage && messageQueue.length > 0) {
            const nextMsg = messageQueue[0];
            setCurrentMessage(nextMsg);
            setIsMessageExiting(false);
            setMessageQueue(prev => prev.slice(1));
        }
    }, [messageQueue, currentMessage]);

    // Handle Message Timer (Exit Animation)
    React.useEffect(() => {
        if (currentMessage) {
            // Start exit animation slightly before removal
            const exitTimer = setTimeout(() => {
                setIsMessageExiting(true);
            }, 2500); // 2.5s visible

            const removeTimer = setTimeout(() => {
                setCurrentMessage(null);
                setIsMessageExiting(false);
            }, 2900); // Wait for exit animation (0.4s)

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(removeTimer);
            };
        }
    }, [currentMessage]);

    // Student Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newStudentName, setNewStudentName] = useState('');

    // Group Leader Modal State
    const [leaderModalOpen, setLeaderModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Audio Context Ref
    const audioContextRef = useRef<AudioContext | null>(null);

    const playTone = (type: 'positive' | 'negative') => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContextClass();
            }

            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const startTime = ctx.currentTime;

            if (type === 'positive') {
                // Clapping sound effect - multiple short bursts
                for (let i = 0; i < 5; i++) {
                    const bufferSize = 4096;
                    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    const output = buffer.getChannelData(0);

                    // White noise burst for clap sound
                    for (let j = 0; j < bufferSize; j++) {
                        output[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / bufferSize, 3);
                    }

                    const source = ctx.createBufferSource();
                    source.buffer = buffer;

                    const gain = ctx.createGain();
                    const filter = ctx.createBiquadFilter();

                    filter.type = 'highpass';
                    filter.frequency.value = 1000;

                    gain.gain.setValueAtTime(0.3, startTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.15 + 0.1);

                    source.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);

                    source.start(startTime + i * 0.15);
                    source.stop(startTime + i * 0.15 + 0.15);
                }
            } else {
                // Negative: Low Dissonance
                const frequencies = [150, 110];
                frequencies.forEach((freq) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, startTime);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + 0.4);

                    gain.gain.setValueAtTime(0.2, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(startTime);
                    osc.stop(startTime + 0.4);
                });
            }
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    const handlePointUpdate = (id: string, delta: number, isGroup: boolean) => {
        if (isGroup) {
            updateGroupPoints(id, delta);
        } else {
            updateStudentPoints(id, delta);
        }

        // Trigger Animation & Sound
        // Clear previous timeout for this ID to prevent early removal
        if (animationTimeouts.current[id]) {
            clearTimeout(animationTimeouts.current[id]);
        }

        // Force re-render of animation by updating key
        setAnimationKeys(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

        setAnimatingId(id);
        setAnimationType(delta > 0 ? 'positive' : 'negative');

        if (delta > 0) {
            if (isSoundEnabled) playTone('positive');
            const randomMsg = POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
            setMessageQueue(prev => [...prev, { id: Date.now() + Math.random(), text: randomMsg, type: 'positive' }]);
        } else {
            if (isSoundEnabled) playTone('negative');
            // Strict messages only for negative points, no confetti or complex animation
            const strictMsg = NEUTRAL_MESSAGES[Math.floor(Math.random() * NEUTRAL_MESSAGES.length)];
            setMessageQueue(prev => [...prev, { id: Date.now() + Math.random(), text: strictMsg, type: 'negative' }]);
        }

        // Set new timeout to clear highlight class
        animationTimeouts.current[id] = setTimeout(() => {
            setAnimatingId(prev => prev === id ? null : prev);
            if (animatingId === id) {
                setAnimationType(null);
            }
        }, 3000);
    };


    return (
        <div className="flex flex-col h-full relative">
            {currentMessage && ReactDOM.createPortal(
                <div key={currentMessage.id} className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
                    {currentMessage.type === 'positive' && (
                        <div className="absolute inset-0 z-0">
                            <ReactConfetti
                                width={windowWidth}
                                height={windowHeight}
                                recycle={false}
                                numberOfPieces={400}
                                gravity={0.2}
                                colors={['#2B899D', '#8EC63F', '#FFD700', '#FFFFFF', '#FF6B6B', '#4ECDC4']}
                            />
                        </div>
                    )}
                    <div
                        className={clsx(
                            "relative z-10 w-full max-w-sm rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 backdrop-blur-2xl px-8 py-10 flex flex-col items-center gap-6 will-change-transform",
                            isMessageExiting ? "animate-msg-out" : "animate-msg-in",
                            currentMessage.type === 'positive'
                                ? "bg-white/90 border-green-400 text-green-700"
                                : "bg-red-50/95 border-red-400 text-red-700"
                        )}>
                        <div className={clsx(
                            "p-4 rounded-full shadow-inner",
                            currentMessage.type === 'positive' ? "bg-green-100/50" : "bg-red-100/50"
                        )}>
                            {currentMessage.type === 'positive'
                                ? <CheckCircle2 size={64} className="stroke-[1.5px] drop-shadow-sm" />
                                : <AlertCircle size={64} className="stroke-[1.5px] drop-shadow-sm" />
                            }
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-4xl font-black">{currentMessage.text}</h2>
                            <p className="text-lg opacity-70 font-bold">
                                {currentMessage.type === 'positive' ? 'مشاركة متميزة!' : 'تنبيه هام'}
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}



            {/* Sticky Header Section */}
            <div className="sticky top-0 bg-white z-10 pb-4">
                {/* Tabs */}
                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 rounded-lg mb-4">
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={clsx(
                            "flex-1 py-1.5 rounded-md font-bold text-base transition-all",
                            activeTab === 'individual' ? "bg-white text-primary-blue shadow-sm" : "text-gray-600 hover:bg-gray-300"
                        )}
                    >
                        مشاركات فردية
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={clsx(
                            "flex-1 py-1.5 rounded-md font-bold text-base transition-all",
                            activeTab === 'group' ? "bg-white text-primary-blue shadow-sm" : "text-gray-600 hover:bg-gray-300"
                        )}
                    >
                        مشاركات جماعية
                    </button>
                </div>

                {/* Fixed Top Controls for Individual Tab - REMOVED */}

            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 pb-2">

                {/* Individual Tab Content (List Only) */}
                {activeTab === 'individual' && (
                    <div className="space-y-3">
                        {students.length === 0 && (
                            <p className="text-center text-gray-400 py-8">لا يوجد طلاب مضافين</p>
                        )}
                        {students.map((student) => (
                            <div
                                key={student.id + (animationKeys[student.id] || '')}
                                className={clsx(
                                    "group flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md",
                                    animatingId === student.id && animationType === 'positive' && "animate-pop !bg-green-50 !border-green-300 ring-2 ring-green-100",
                                    animatingId === student.id && animationType === 'negative' && "animate-shake !bg-red-50 !border-red-300 ring-2 ring-red-100"
                                )}
                            >
                                {editingId === student.id ? (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (editName.trim()) {
                                                updateStudentName(student.id, editName.trim());
                                                setEditingId(null);
                                            }
                                        }}
                                        className="flex items-center gap-2 flex-1 p-1"
                                    >
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="px-3 py-2 border-2 border-primary-blue rounded-lg bg-white focus:outline-none w-full font-bold text-gray-800 text-lg"
                                            autoFocus
                                            onBlur={() => {
                                                // Optional: save on blur or cancel? Let's keep manual save to avoid accidental edits
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-lg transition-colors shadow-sm"
                                        >
                                            <Check size={20} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </form>
                                ) : (
                                    <>
                                        {/* Name & Actions */}
                                        <span className="font-bold text-gray-800 truncate text-lg select-none" title={student.name}>
                                            {student.name}
                                        </span>

                                        {/* Actions - Hidden when locked - MOVED TO LEFT (End) */}
                                        {!isEditLocked && (
                                            <div className="flex bg-gray-50 rounded-lg p-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-auto">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(student.id);
                                                        setEditName(student.name);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-primary-blue hover:bg-white rounded-md transition-all"
                                                    title="تعديل الاسم"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`هل تريد حذف الطالب ${student.name} من هذا الفصل؟`)) {
                                                            deleteStudent(student.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-md transition-all"
                                                    title="حذف الطالب"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Score Controls - Strict Layout */}
                                <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                                    <button
                                        onClick={() => handlePointUpdate(student.id, 5, false)}
                                        className="w-11 h-11 flex items-center justify-center bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors shadow-sm active:scale-95"
                                    >
                                        <Plus size={22} className="stroke-[3px]" />
                                    </button>

                                    <div className="min-w-[3rem] px-1 text-center font-black text-2xl text-primary-dark tracking-tight tabular-nums select-none leading-none">
                                        {student.points}
                                    </div>

                                    <button
                                        onClick={() => handlePointUpdate(student.id, -5, false)}
                                        className="w-11 h-11 flex items-center justify-center bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors shadow-sm active:scale-95"
                                    >
                                        <Minus size={22} className="stroke-[3px]" />
                                    </button>
                                </div>
                            </div>

                        ))}

                        {/* Add Student Input */}
                        {!isEditLocked && (
                            <div className="mt-2 pt-3 border-t border-gray-100 bg-white/95 backdrop-blur-sm pb-1">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newStudentName}
                                        onChange={(e) => setNewStudentName(e.target.value)}
                                        placeholder="إضافة طالب جديد..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent font-bold text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newStudentName.trim()) {
                                                addStudent(newStudentName.trim());
                                                setNewStudentName('');
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (newStudentName.trim()) {
                                                addStudent(newStudentName.trim());
                                                setNewStudentName('');
                                            }
                                        }}
                                        className="bg-primary-blue text-white p-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Group Tab Content */}
                {activeTab === 'group' && (
                    <div className="space-y-4">
                        {groups.map((group) => (
                            <div
                                key={group.id + (animationKeys[group.id] || '')}
                                className={clsx(
                                    "flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md gap-3",
                                    animatingId === group.id && animationType === 'positive' && "animate-pop !bg-green-50 !border-green-300 ring-2 ring-green-100",
                                    animatingId === group.id && animationType === 'negative' && "animate-shake !bg-red-50 !border-red-300 ring-2 ring-red-100"
                                )}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        {/* Group Name & Leader */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <input
                                                    type="text"
                                                    value={group.name}
                                                    onChange={(e) => updateGroupName(group.id, e.target.value)}
                                                    className="font-bold text-gray-800 text-xl bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-blue focus:outline-none w-full transition-colors truncate"
                                                    placeholder="اسم المجموعة"
                                                />
                                                {!isEditLocked && <Edit2 size={14} className="text-gray-400 opacity-50 flex-shrink-0" />}
                                            </div>

                                            {!isEditLocked && (
                                                <button
                                                    onClick={() => deleteGroup(group.id)}
                                                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-all opacity-50 hover:opacity-100"
                                                    title="حذف المجموعة"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Leader Selection */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Crown size={14} className="text-yellow-500" />
                                            <span className="font-bold">القائد:</span>
                                            {group.leader ? (
                                                <button
                                                    onClick={() => { setSelectedGroupId(group.id); setLeaderModalOpen(true); }}
                                                    className="font-bold text-primary-blue underline hover:text-blue-700 truncate max-w-[120px]"
                                                >
                                                    {group.leader}
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={isEditLocked}
                                                    onClick={() => { setSelectedGroupId(group.id); setLeaderModalOpen(true); }}
                                                    className={clsx(
                                                        "text-xs px-2 py-0.5 rounded transition-colors",
                                                        isEditLocked ? "bg-gray-100 text-gray-400 cursor-default" : "bg-blue-100 text-primary-blue hover:bg-blue-200"
                                                    )}
                                                >
                                                    تحديد قائد
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Score Controls - Strict Layout */}
                                    <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-100 flex-shrink-0">
                                        <button
                                            onClick={() => handlePointUpdate(group.id, 5, true)}
                                            className="w-11 h-11 flex items-center justify-center bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors shadow-sm active:scale-95"
                                        >
                                            <Plus size={22} className="stroke-[3px]" />
                                        </button>

                                        <div className="min-w-[3.5rem] px-1 text-center font-black text-3xl text-primary-dark tracking-tight tabular-nums select-none leading-none">
                                            {group.points}
                                        </div>

                                        <button
                                            onClick={() => handlePointUpdate(group.id, -5, true)}
                                            className="w-11 h-11 flex items-center justify-center bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors shadow-sm active:scale-95"
                                        >
                                            <Minus size={22} className="stroke-[3px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Leader Selection Modal */}
            {
                leaderModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800">اختيار قائد للمجموعة</h3>
                                <button onClick={() => setLeaderModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {classStudents.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8">لا توجد قائمة طلاب للفصل الحالي</p>
                                ) : (
                                    classStudents.map((name, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (selectedGroupId) {
                                                    updateGroupLeader(selectedGroupId, name);
                                                    setLeaderModalOpen(false);
                                                }
                                            }}
                                            className="w-full text-right p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-primary-blue transition-all flex items-center gap-2"
                                        >
                                            <Crown size={16} className="text-gray-300" />
                                            <span className="font-medium">{name}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
