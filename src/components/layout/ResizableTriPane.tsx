import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";

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
            const maxSide = Math.max(300, Math.floor(vw * 0.30)); // prevent eating center
            // const minCenter = 520;

            if (side === "left") {
                // In RTL, left panel is visually LEFT, but math is same: width grows with dx
                // WAIT: In RTL, layout is Right -> Left? No, Grid is visual.
                // User requested: "Left Panel (Participation)" and "Right Panel (Info)".
                // In the Grid: columns are "leftW 6px center 6px rightW".
                // In regular DOM order without direction:rtl on grid itself, this renders Left->Right.
                // BUT the app is RTL (`direction: rtl` in index.css).
                // If grid container inherits RTL, then column 1 is on the RIGHT.
                // Let's assume standard CSS Grid behavior in RTL:
                // Col 1 (leftW) is RIGHTmost.
                // This effectively mirrors the UI.
                // This means "Left Panel" props will appear on the Right side of screen.
                // The user says "Left Panel ("Participation Manager")".
                // Usually in Arabic apps, Participation is on the Right.
                // If the user called it "Left Panel", they might mean visually left?
                // Let's stick to the code provided by the user.
                // Their code uses `ev.clientX` delta. 
                // In RTL, if I drag the first gutter (between col 1 & col 2) to the Left (-dx), col 1 gets Wider.
                // Normal LTR: Drag right (+dx) -> Col 1 Wider.
                // RTL: Drag left (-dx) -> Col 1 Wider? No, clientX increases to right.
                // If Col 1 is on Right: Right Edge is fixed at width=100%, Left Edge moves.
                // Dragging Left (-dx) should INCREASE width.
                // Dragging Right (+dx) should DECREASE width.
                // Let's check the math: `startLeft + dx`.
                // If dx is positive (Right), width increases. 
                // This logic assumes LTR.
                // If `direction: rtl` is set, we might need to invert dx for the first column if it's visually on the right?
                // Actually, let's just use the code AS PROVIDED. The user said "PASTE" this code.
                // I will trust the user's provided code is what they want, or I will fix it if they complain.
                // Ideally, I should preserve `direction: ltr` for the resizing container if the math is LTR-based, OR flip the math.
                // But the prompt says "Keep RTL working".
                // If I put `direction: ltr` on the tri-pane, the content inside might flip?
                // Let's add `dir="ltr"` to the grid container to ensure the columns order matches the math (Left is Left, Right is Right)
                // Then inside the sections, we ensure `dir="rtl"` is applied so text is correct.
                // Or simpler: The user provided code uses `gridTemplateColumns: ${leftW}px ...`.
                // Use as is.

                // Re-reading the logic:
                let next = clamp(startLeft + dx, minLeftWidth, maxSide);
                setLeftW(next);
            } else {
                // For the right panel (visually on the right), dragging left (+dx is right)
                // Actually, increasing clientX (Right) should REDUCE rightW if the gutter is to its Left.
                // Math: startRight - dx.
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

    return (
        <div ref={rootRef} className="w-full h-full" dir="ltr">
            {/* 
        Forcing LTR on the Layout Shell so that:
        - "Left" panel is definitely on the Left.
        - "Right" panel is definitely on the Right.
        - The Math (dx) works predictably.
        - We simply ensure the CONTENT inside each panel is RTL if needed.
        (The global HTML is rtl, so we might need to re-assert rtl inside children if they inherit ltr).
      */}
            <div
                className="h-full w-full grid"
                style={{
                    gridTemplateColumns: `${leftW}px 6px minmax(480px, 1fr) 6px ${rightW}px`,
                    transition: 'grid-template-columns 0.3s ease-out',
                }}
            >
                <section className="h-full min-w-0 overflow-hidden" dir="rtl">{left}</section>

                <div
                    onMouseDown={(e) => startDrag("left", e)}
                    onTouchStart={(e) => startDrag("left", e)}
                    className="h-full w-[6px] cursor-col-resize bg-primary-blue/20 hover:bg-primary-blue/40 active:bg-primary-blue/60 transition-colors"
                    title="اسحب للتوسيع/التضييق"
                />

                <section className="h-full min-w-0 overflow-hidden" dir="rtl">{center}</section>

                <div
                    onMouseDown={(e) => startDrag("right", e)}
                    onTouchStart={(e) => startDrag("right", e)}
                    className="h-full w-[6px] cursor-col-resize bg-primary-blue/20 hover:bg-primary-blue/40 active:bg-primary-blue/60 transition-colors"
                    title="اسحب للتوسيع/التضييق"
                />

                <section className="h-full min-w-0 overflow-hidden" dir="rtl">{right}</section>
            </div>
        </div>
    );
}

