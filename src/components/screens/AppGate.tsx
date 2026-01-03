import React, { useEffect, useState, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppGateProps {
    children: ReactNode;
}

interface RemoteConfig {
    enabled: boolean;
    message: string;
    minVersion?: string;
}

// Remote config URL - hosted on Vercel with the app
// Change enabled to false in this file to disable the app remotely
const CONFIG_URL = '/api/config.json';

export const AppGate: React.FC<AppGateProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isEnabled, setIsEnabled] = useState(true);
    const [disabledMessage, setDisabledMessage] = useState('');

    const checkAppStatus = async () => {
        setIsLoading(true);

        try {
            const response = await fetch(CONFIG_URL, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });

            if (!response.ok) {
                // If config not found, allow app to work (fail-open)
                setIsEnabled(true);
                setIsLoading(false);
                return;
            }

            const config: RemoteConfig = await response.json();
            setIsEnabled(config.enabled);
            setDisabledMessage(config.message || 'التطبيق غير متاح حالياً');
        } catch (err) {
            // On network error, allow app to work (fail-open for offline use)
            console.log('Config check failed, allowing app access');
            setIsEnabled(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAppStatus();

        // Re-check every 5 minutes while app is open
        const interval = setInterval(checkAppStatus, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Loading screen
    if (isLoading) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-primary-blue to-blue-700 flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
                <p className="text-xl font-bold">جاري التحميل...</p>
            </div>
        );
    }

    // Disabled screen (Kill Switch active)
    if (!isEnabled) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white p-8">
                <div className="bg-white/10 rounded-3xl p-10 backdrop-blur-sm max-w-md text-center">
                    <div className="bg-red-500/20 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <AlertTriangle size={48} className="text-red-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-4">التطبيق غير متاح</h1>
                    <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                        {disabledMessage}
                    </p>
                    <button
                        onClick={checkAppStatus}
                        className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto transition-all"
                    >
                        <RefreshCw size={20} />
                        إعادة المحاولة
                    </button>
                </div>
                <p className="text-gray-500 text-sm mt-8">مدارس المتقدمة - السبورة الذكية</p>
            </div>
        );
    }

    // App is enabled - render children
    return <>{children}</>;
};
