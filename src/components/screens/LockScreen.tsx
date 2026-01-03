import React, { useState } from 'react';
import { ShieldX, RefreshCw, KeyRound, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { LockReason, LOCK_MESSAGES, fetchRemotePolicy, clearLock, getDebugInfo } from '../../security/expiryGuard';
import { ADMIN_PIN } from '../../security/config';

interface LockScreenProps {
    reason: LockReason;
    onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ reason, onUnlock }) => {
    const [showPinInput, setShowPinInput] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const message = LOCK_MESSAGES[reason] || 'التطبيق غير متاح';

    const getIcon = () => {
        switch (reason) {
            case LockReason.EXPIRED:
                return <Clock size={64} className="text-orange-400" />;
            case LockReason.TIME_TAMPER:
                return <AlertTriangle size={64} className="text-red-400" />;
            case LockReason.DISABLED:
                return <XCircle size={64} className="text-red-400" />;
            default:
                return <ShieldX size={64} className="text-red-400" />;
        }
    };

    const handleCheckUpdates = async () => {
        setIsChecking(true);
        try {
            const result = await fetchRemotePolicy();
            if (!result.isLocked) {
                onUnlock();
            }
        } finally {
            setIsChecking(false);
        }
    };

    const handlePinSubmit = async () => {
        if (pin === ADMIN_PIN) {
            setPinError(false);
            setShowPinInput(false);
            clearLock();
            // After admin unlock, must re-check policy
            setIsChecking(true);
            try {
                const result = await fetchRemotePolicy();
                if (!result.isLocked) {
                    onUnlock();
                }
            } finally {
                setIsChecking(false);
            }
        } else {
            setPinError(true);
            setPin('');
        }
    };

    const debugInfo = showDebug ? getDebugInfo() : null;

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center text-white p-6 fixed inset-0 z-[9999]">
            {/* Main Card */}
            <div className="bg-white/10 rounded-3xl p-10 backdrop-blur-lg max-w-md w-full text-center shadow-2xl border border-white/10">
                {/* Icon */}
                <div className="bg-red-500/20 rounded-full p-5 w-28 h-28 mx-auto mb-8 flex items-center justify-center">
                    {getIcon()}
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold mb-4">{message}</h1>

                {/* Description */}
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {reason === LockReason.EXPIRED && 'يرجى التواصل مع المسؤول لتجديد الصلاحية'}
                    {reason === LockReason.TIME_TAMPER && 'يرجى ضبط وقت الجهاز بشكل صحيح'}
                    {reason === LockReason.DISABLED && 'تم إيقاف التطبيق من قبل المسؤول'}
                </p>

                {/* PIN Input */}
                {showPinInput ? (
                    <div className="space-y-4 mb-6">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="أدخل رمز المسؤول"
                            className={`w-full px-4 py-3 rounded-xl bg-white/10 border-2 text-white placeholder-gray-400 text-center text-xl tracking-widest focus:outline-none ${pinError ? 'border-red-500' : 'border-white/20 focus:border-blue-400'
                                }`}
                            maxLength={10}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                        />
                        {pinError && (
                            <p className="text-red-400 text-sm">رمز غير صحيح</p>
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPinInput(false); setPin(''); setPinError(false); }}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-3 rounded-xl font-bold transition-all"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handlePinSubmit}
                                disabled={!pin}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 rounded-xl font-bold transition-all"
                            >
                                تأكيد
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Check Updates Button */}
                        <button
                            onClick={handleCheckUpdates}
                            disabled={isChecking}
                            className="w-full bg-white/20 hover:bg-white/30 disabled:opacity-50 px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
                        >
                            <RefreshCw size={22} className={isChecking ? 'animate-spin' : ''} />
                            {isChecking ? 'جاري التحقق...' : 'التحقق من التحديثات'}
                        </button>

                        {/* Admin Access Button */}
                        <button
                            onClick={() => setShowPinInput(true)}
                            className="w-full bg-transparent hover:bg-white/10 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all border border-white/10"
                        >
                            <KeyRound size={18} />
                            دخول المسؤول
                        </button>
                    </div>
                )}
            </div>

            {/* Footer */}
            <p className="text-gray-600 text-sm mt-8">مدارس المتقدمة - السبورة الذكية</p>

            {/* Debug Info (tap 5 times on footer to show) */}
            <button
                onClick={() => setShowDebug(!showDebug)}
                className="text-gray-700 text-xs mt-2 opacity-50"
            >
                v1.0.0
            </button>

            {showDebug && debugInfo && (
                <div className="mt-4 bg-black/50 p-4 rounded-lg text-xs text-left font-mono max-w-md w-full">
                    <p>Now: {debugInfo.now}</p>
                    <p>Default Expiry: {debugInfo.defaultExpiry}</p>
                    {debugInfo.policy && (
                        <>
                            <p>Policy Expiry: {debugInfo.policy.expiryDate}</p>
                            <p>Last Seen: {debugInfo.policy.lastSeenTime}</p>
                            <p>Last Sync: {debugInfo.policy.lastServerSync || 'Never'}</p>
                            <p>Lock Reason: {debugInfo.policy.lockReason}</p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
