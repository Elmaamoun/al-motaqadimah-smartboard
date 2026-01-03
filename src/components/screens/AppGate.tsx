import React, { useEffect, useState, useCallback, type ReactNode } from 'react';
import { checkExpiry, fetchRemotePolicy, LockReason, type ExpiryCheckResult } from '../../security/expiryGuard';
import { LockScreen } from './LockScreen';

interface AppGateProps {
    children: ReactNode;
}

export const AppGate: React.FC<AppGateProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [lockReason, setLockReason] = useState<LockReason>(LockReason.NONE);

    // Main check function
    const performCheck = useCallback(async (fetchRemote: boolean = false) => {
        let result: ExpiryCheckResult;

        if (fetchRemote && navigator.onLine) {
            // Try to fetch remote policy first
            result = await fetchRemotePolicy();
        } else {
            // Just check local expiry
            result = checkExpiry();
        }

        setIsLocked(result.isLocked);
        setLockReason(result.reason);
        setIsLoading(false);
    }, []);

    // Initial check on mount
    useEffect(() => {
        performCheck(true); // Try to fetch remote on initial load
    }, [performCheck]);

    // Check on visibility change (when app comes back to foreground)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                performCheck(false); // Local check only on resume
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [performCheck]);

    // Check on focus (additional safety)
    useEffect(() => {
        const handleFocus = () => {
            performCheck(false);
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [performCheck]);

    // Periodic online check (every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            if (navigator.onLine) {
                performCheck(true);
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [performCheck]);

    // Handle online event to refresh policy
    useEffect(() => {
        const handleOnline = () => {
            performCheck(true);
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [performCheck]);

    // Handle unlock from LockScreen
    const handleUnlock = useCallback(() => {
        setIsLocked(false);
        setLockReason(LockReason.NONE);
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

    // Lock screen
    if (isLocked) {
        return <LockScreen reason={lockReason} onUnlock={handleUnlock} />;
    }

    // App is enabled - render children
    return <>{children}</>;
};
