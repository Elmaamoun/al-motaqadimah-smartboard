/**
 * Handles Global UI Scaling to achieve a specific physical size.
 * Target: 0.9375 total multiplier (DPR * Scale).
 * This makes the app look like 75% zoom on a 1.25 DPR screen (100% * 0.75 * 1.25 = 0.9375).
 */

export interface AppScaleInfo {
    scale: number;
    invScale: number;
    dpr: number;
}

export function getAppScaleInfo(): AppScaleInfo {
    const dpr = window.devicePixelRatio || 1;
    // User's "Ideal" environment results in an effective dpr of 0.9375.
    // We want to force this "look" at 100% browser zoom across all devices.
    const targetDpr = 1.0;
    const scale = targetDpr / dpr;

    return {
        scale,
        invScale: 1 / scale,
        dpr
    };
}

export function applyGlobalScale() {
    const info = getAppScaleInfo();
    const root = document.documentElement;
    root.style.setProperty('--ui-scale', info.scale.toString());
    root.style.setProperty('--ui-scale-inv', info.invScale.toString());
    return info;
}

export function mountScaler(onUpdate?: (info: AppScaleInfo) => void) {
    let rafId: number;
    const update = () => {
        const info = applyGlobalScale();
        if (onUpdate) onUpdate(info);
    };

    const throttledUpdate = () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(update);
    };

    window.addEventListener('resize', throttledUpdate);

    // Watch for DPI/Zoom changes
    const dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    dprMedia.addEventListener('change', throttledUpdate);

    update();

    return () => {
        window.removeEventListener('resize', throttledUpdate);
        dprMedia.removeEventListener('change', throttledUpdate);
        cancelAnimationFrame(rafId);
    };
}
