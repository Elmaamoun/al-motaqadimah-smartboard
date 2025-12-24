/**
 * React hook to get the current app scale factor.
 * This is essential for components that need to account for the global CSS transform scaling.
 */

import { useState, useEffect } from 'react';
import { getAppScaleInfo } from './appScale';
import type { AppScaleInfo } from './appScale';

/**
 * Hook that returns the current app scale information.
 * Updates when the window resizes or DPR changes.
 */
export function useAppScale(): AppScaleInfo {
    const [scaleInfo, setScaleInfo] = useState<AppScaleInfo>(() => getAppScaleInfo());

    useEffect(() => {
        const handleUpdate = () => {
            setScaleInfo(getAppScaleInfo());
        };

        window.addEventListener('resize', handleUpdate);

        // Watch for DPI/Zoom changes
        const dprMedia = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        dprMedia.addEventListener('change', handleUpdate);

        return () => {
            window.removeEventListener('resize', handleUpdate);
            dprMedia.removeEventListener('change', handleUpdate);
        };
    }, []);

    return scaleInfo;
}

/**
 * Get the scale factor from CSS variables.
 * Useful for non-hook contexts.
 */
export function getScaleFromCSS(): number {
    const scaleStr = getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim();
    return parseFloat(scaleStr) || 1;
}

/**
 * Convert screen coordinates to logical coordinates.
 * Use this when handling pointer events on scaled elements.
 * @param screenX - X coordinate from pointer event (clientX - rect.left)
 * @param screenY - Y coordinate from pointer event (clientY - rect.top)
 * @param scale - The current app scale factor (from useAppScale or getScaleFromCSS)
 */
export function screenToLogical(screenX: number, screenY: number, scale: number): { x: number; y: number } {
    // Since the element is scaled, getBoundingClientRect() returns scaled dimensions.
    // This means (clientX - rect.left) is already in scaled space.
    // We need to divide by the scale to get logical coordinates.
    return {
        x: screenX / scale,
        y: screenY / scale
    };
}
