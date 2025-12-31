import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { GripVertical } from "lucide-react";

type Props = {
    left: React.ReactNode;
    center: React.ReactNode;
    right: React.ReactNode;
    storageKey?: string; // allow per-page saving
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function ResizableTriPane({
    left,
    center,
    right,
    storageKey = "triPane:v1",
}: Props) {
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Get edit lock state for dynamic width
    const { isEditLocked } = useApp();

    // Default widths (Reduced for smaller UI)
    const defaults = useMemo(() => ({ left: 300, right: 320 }), []);
    const [leftW, setLeftW] = useState(defaults.left);
    const [rightW, setRightW] = useState(defaults.right);

    // Dynamic minimum width based on edit lock state
    const minLeftWidth = !isEditLocked ? 340 : 240;

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (typeof parsed.leftW === "number") setLeftW(parsed.leftW);
            if (typeof parsed.rightW === "number") setRightW(parsed.rightW);
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify({ leftW, rightW }));
        } catch { }
    }, [leftW, rightW, storageKey]);

    // Auto-expand left panel when edit lock is opened
    useEffect(() => {
        if (!isEditLocked && leftW < 340) {
            setLeftW(340); // Expand to show full group names
        }
    }, [isEditLocked, leftW]);

    const startDrag = (side: "left" | "right", e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();

        // Get initial X position from either mouse or touch
        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const startLeft = leftW;
        const startRight = rightW;

        const onMove = (ev: MouseEvent | TouchEvent) => {
            // Get current X from either mouse or touch
            const currentX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
            const dx = currentX - startX;
            const el = rootRef.current;
            const vw = el?.clientWidth ?? window.innerWidth;

            // Limits
            const minSide = 220;
            const maxSide = Math.max(300, Math.floor(vw * 0.30));

            if (side === "left") {
                let next = clamp(startLeft + dx, minLeftWidth, maxSide);
                setLeftW(next);
            } else {
                let next = clamp(startRight - dx, minSide, maxSide);
                setRightW(next);
            }
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove as any);
            window.removeEventListener("mouseup", onUp);
            window.removeEventListener("touchmove", onMove as any);
            window.removeEventListener("touchend", onUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", onMove as any);
        window.addEventListener("mouseup", onUp);
        window.addEventListener("touchmove", onMove as any, { passive: false });
        window.addEventListener("touchend", onUp);
    };

    // Touch-friendly resize handle component
    const ResizeHandle = ({ side }: { side: "left" | "right" }) => (
        <div
            onMouseDown={(e) => startDrag(side, e)}
            onTouchStart={(e) => startDrag(side, e)}
            className="h-full w-4 cursor-col-resize bg-gray-100 hover:bg-primary-blue/30 active:bg-primary-blue/50 transition-colors flex items-center justify-center group touch-none"
            title="اسحب للتوسيع/التضييق"
        >
            {/* Grip indicator - visible dots for touch */}
            <div className="flex flex-col items-center gap-1 opacity-40 group-hover:opacity-70 group-active:opacity-100 transition-opacity">
                <GripVertical size={16} className="text-gray-500" />
            </div>
        </div>
    );

    return (
        <div ref={rootRef} className="w-full h-full" dir="ltr">
            <div
                className="h-full w-full grid"
                style={{
                    gridTemplateColumns: `${leftW}px 16px minmax(480px, 1fr) 16px ${rightW}px`,
                    transition: 'grid-template-columns 0.3s ease-out',
                }}
            >
                <section className="h-full min-w-0 overflow-hidden" dir="rtl">{left}</section>

                <ResizeHandle side="left" />

                <section className="h-full min-w-0 overflow-hidden" dir="rtl">{center}</section>

                <ResizeHandle side="right" />

                <section className="h-full min-w-0 overflow-hidden" dir="rtl">{right}</section>
            </div>
        </div>
    );
}
