// Security Configuration
// Change these values to configure the app's expiry behavior

// Hard cutoff date - app will lock after this date even offline
export const DEFAULT_OFFLINE_EXPIRY = "2026-02-01T23:59:59+03:00";

// Remote policy URL - fetched when online to extend expiry
export const POLICY_URL = "/api/policy.json";

// Admin PIN for emergency access (to re-check policy, not bypass)
export const ADMIN_PIN = "123456";

// Time drift threshold for anti-tamper (5 minutes in milliseconds)
export const TIME_DRIFT_THRESHOLD = 5 * 60 * 1000;

// Policy fetch timeout (3 seconds)
export const FETCH_TIMEOUT = 3000;

// Local storage key for policy
export const POLICY_STORAGE_KEY = "smartboard_security_policy";
