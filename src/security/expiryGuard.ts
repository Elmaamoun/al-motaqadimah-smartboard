import {
    DEFAULT_OFFLINE_EXPIRY,
    POLICY_URL,
    TIME_DRIFT_THRESHOLD,
    FETCH_TIMEOUT,
    POLICY_STORAGE_KEY
} from './config';

// Lock reasons
export const LockReason = {
    NONE: 'NONE',
    EXPIRED: 'EXPIRED',
    TIME_TAMPER: 'TIME_TAMPER',
    DISABLED: 'DISABLED'
} as const;

export type LockReason = typeof LockReason[keyof typeof LockReason];

// Arabic messages for each lock reason
export const LOCK_MESSAGES: Record<LockReason, string> = {
    [LockReason.NONE]: '',
    [LockReason.EXPIRED]: 'انتهت صلاحية التطبيق',
    [LockReason.TIME_TAMPER]: 'تم رصد تغيير في وقت الجهاز',
    [LockReason.DISABLED]: 'تم إيقاف التطبيق'
};

// Policy interface
export interface ExpiryPolicy {
    expiryDate: string;      // ISO string
    lastSeenTime: string;    // ISO string
    lastServerSync?: string; // ISO string, optional
    lockReason?: LockReason;
}

// Remote policy response
interface RemotePolicyResponse {
    enabled: boolean;
    expiryDate: string;
}

// Check result
export interface ExpiryCheckResult {
    isLocked: boolean;
    reason: LockReason;
    message: string;
    policy: ExpiryPolicy;
}

/**
 * Load policy from localStorage
 */
export function loadPolicy(): ExpiryPolicy | null {
    try {
        const stored = localStorage.getItem(POLICY_STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored) as ExpiryPolicy;
    } catch {
        return null;
    }
}

/**
 * Save policy to localStorage
 */
export function savePolicy(policy: ExpiryPolicy): void {
    try {
        localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policy));
    } catch (e) {
        console.error('Failed to save policy:', e);
    }
}

/**
 * Initialize default policy
 */
export function initializePolicy(): ExpiryPolicy {
    const now = new Date().toISOString();
    const policy: ExpiryPolicy = {
        expiryDate: DEFAULT_OFFLINE_EXPIRY,
        lastSeenTime: now,
        lockReason: LockReason.NONE
    };
    savePolicy(policy);
    return policy;
}

/**
 * Main expiry check - call on bootstrap and on resume
 */
export function checkExpiry(): ExpiryCheckResult {
    const now = new Date();
    let policy = loadPolicy();

    // Initialize if no policy exists
    if (!policy) {
        policy = initializePolicy();
    }

    // Anti-tamper: Check if time went backwards
    if (policy.lastSeenTime) {
        const lastSeen = new Date(policy.lastSeenTime);
        const timeDiff = now.getTime() - lastSeen.getTime();

        // If current time is more than threshold BEFORE lastSeenTime, it's tampered
        if (timeDiff < -TIME_DRIFT_THRESHOLD) {
            policy.lockReason = LockReason.TIME_TAMPER;
            savePolicy(policy);
            return {
                isLocked: true,
                reason: LockReason.TIME_TAMPER,
                message: LOCK_MESSAGES[LockReason.TIME_TAMPER],
                policy
            };
        }
    }

    // Check if already locked
    if (policy.lockReason && policy.lockReason !== LockReason.NONE) {
        return {
            isLocked: true,
            reason: policy.lockReason,
            message: LOCK_MESSAGES[policy.lockReason],
            policy
        };
    }

    // Check expiry
    const expiryDate = new Date(policy.expiryDate);
    if (now > expiryDate) {
        policy.lockReason = LockReason.EXPIRED;
        savePolicy(policy);
        return {
            isLocked: true,
            reason: LockReason.EXPIRED,
            message: LOCK_MESSAGES[LockReason.EXPIRED],
            policy
        };
    }

    // Not locked - update lastSeenTime
    policy.lastSeenTime = now.toISOString();
    policy.lockReason = LockReason.NONE;
    savePolicy(policy);

    return {
        isLocked: false,
        reason: LockReason.NONE,
        message: '',
        policy
    };
}

/**
 * Fetch remote policy and update local if valid
 */
export async function fetchRemotePolicy(): Promise<ExpiryCheckResult> {
    let policy = loadPolicy();
    if (!policy) {
        policy = initializePolicy();
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(POLICY_URL, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Server error - continue with local policy
            return checkExpiry();
        }

        const remotePolicy: RemotePolicyResponse = await response.json();

        // Check if app is disabled remotely
        if (!remotePolicy.enabled) {
            policy.lockReason = LockReason.DISABLED;
            savePolicy(policy);
            return {
                isLocked: true,
                reason: LockReason.DISABLED,
                message: LOCK_MESSAGES[LockReason.DISABLED],
                policy
            };
        }

        // Check if remote expiry extends local expiry
        if (remotePolicy.expiryDate) {
            const remoteExpiry = new Date(remotePolicy.expiryDate);
            const localExpiry = new Date(policy.expiryDate);

            if (remoteExpiry > localExpiry) {
                policy.expiryDate = remotePolicy.expiryDate;
            }
        }

        // Update sync time
        policy.lastServerSync = new Date().toISOString();
        policy.lockReason = LockReason.NONE;
        savePolicy(policy);

        // Re-run expiry check with updated policy
        return checkExpiry();

    } catch (err) {
        // Network error - continue with local policy check
        console.log('Remote policy fetch failed, using local policy');
        return checkExpiry();
    }
}

/**
 * Clear lock (for admin re-check only)
 * Does NOT bypass - must call fetchRemotePolicy after
 */
export function clearLock(): void {
    const policy = loadPolicy();
    if (policy) {
        policy.lockReason = LockReason.NONE;
        policy.lastSeenTime = new Date().toISOString();
        savePolicy(policy);
    }
}

/**
 * Get current policy for debug display
 */
export function getDebugInfo(): { policy: ExpiryPolicy | null; now: string; defaultExpiry: string } {
    return {
        policy: loadPolicy(),
        now: new Date().toISOString(),
        defaultExpiry: DEFAULT_OFFLINE_EXPIRY
    };
}
