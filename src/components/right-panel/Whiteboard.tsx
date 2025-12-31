import React, { useState, useRef } from 'react';
import { Eraser, Pen, Trash2, Undo, Redo, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';

interface Point {
    x: number;
    y: number;
    pressure?: number;
}

interface Stroke {
    points: Point[];
    color: string;
    size: number;
    isEraser: boolean;
}

const COLORS = ['#000000', '#EF4444']; // Black and Red only

export const Whiteboard: React.FC = () => {
    const [pages, setPages] = useState<{ strokes: Stroke[], redoStack: Stroke[] }[]>([
        { strokes: [], redoStack: [] }
    ]);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [color, setColor] = useState('#000000');
    const [size] = useState(4); // Standard pen thickness
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const strokes = pages[currentPage].strokes;
    const redoStack = pages[currentPage].redoStack;

    const updatePage = (newStrokes: Stroke[], newRedoStack: Stroke[]) => {
        const newPages = [...pages];
        newPages[currentPage] = { strokes: newStrokes, redoStack: newRedoStack };
        setPages(newPages);
    };

    const getSvgPoint = (e: React.PointerEvent | PointerEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();

        // Simple direct coordinate mapping
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        return {
            x,
            y,
            pressure: e.pressure,
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const point = getSvgPoint(e);
        setCurrentStroke({
            points: [point],
            color: tool === 'eraser' ? '#FFFFFF' : color,
            size: tool === 'eraser' ? 50 : size, // Increased eraser size from 40 to 50
            isEraser: tool === 'eraser',
        });
        // Clear redo stack on new action
        updatePage(strokes, []);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const point = getSvgPoint(e);
        // Always update cursor position for eraser circle
        setCursorPos({ x: point.x, y: point.y });

        if (!currentStroke) return;
        setCurrentStroke({
            ...currentStroke,
            points: [...currentStroke.points, point],
        });
    };

    const handlePointerUp = () => {
        if (!currentStroke) return;
        updatePage([...strokes, currentStroke], redoStack);
        setCurrentStroke(null);
    };

    const handleUndo = () => {
        if (strokes.length === 0) return;
        const lastStroke = strokes[strokes.length - 1];
        updatePage(strokes.slice(0, -1), [...redoStack, lastStroke]);
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        const strokeToRestore = redoStack[redoStack.length - 1];
        updatePage([...strokes, strokeToRestore], redoStack.slice(0, -1));
    };

    const handleClearPage = () => {
        // Delete directly without confirmation
        updatePage([], []);
    };

    const addNewPage = () => {
        const newPages = [...pages, { strokes: [], redoStack: [] }];
        setPages(newPages);
        setCurrentPage(newPages.length - 1);
    };

    const removePage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (pages.length === 1) {
            updatePage([], []);
            return;
        }
        const newPages = pages.filter((_, i) => i !== index);
        setPages(newPages);
        if (currentPage >= newPages.length) {
            setCurrentPage(newPages.length - 1);
        } else if (index < currentPage) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Smooth bezier curve rendering for natural drawing
    const renderStroke = (stroke: Stroke) => {
        if (stroke.points.length < 2) return null;

        const points = stroke.points;

        // Build smooth path using quadratic bezier curves
        let pathData = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

        for (let i = 1; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            // Midpoint as control point for smooth curve
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;
            pathData += ` Q ${current.x.toFixed(1)} ${current.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
        }

        // End with last point
        if (points.length > 1) {
            const last = points[points.length - 1];
            pathData += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
        }

        return (
            <path
                d={pathData}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.size}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        );
    };

    return (
        <div className="h-full flex flex-col p-4 bg-gray-50">
            {/* Main Container with Soft Corners and Shadow */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">

                {/* Pages Tab Bar - Clean integrated look */}
                <div className="flex items-center gap-1 bg-gray-50 border-b border-gray-100 p-1 overflow-x-auto">
                    {pages.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentPage(idx)}
                            className={clsx(
                                "group relative px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all select-none flex items-center gap-2",
                                currentPage === idx
                                    ? "bg-white text-primary-blue shadow-sm border border-gray-200"
                                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            )}
                        >
                            <span>صفحة {idx + 1}</span>
                            {pages.length > 1 && (
                                <button
                                    onClick={(e) => removePage(idx, e)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-100 hover:text-red-500 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addNewPage}
                        className="p-2 text-primary-blue hover:bg-blue-50 rounded-lg transition-colors"
                        title="صفحة جديدة"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Toolbar - Responsive Horizontal */}
                <div
                    ref={toolbarRef}
                    className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur shadow-lg border border-gray-200 rounded-2xl p-2 flex items-center gap-1.5 z-20"
                    style={{ maxWidth: 'calc(100% - 2rem)' }}
                >

                    {/* Color Palette */}
                    <div className="flex items-center gap-1.5">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => { setColor(c); setTool('pen'); }}
                                className={clsx(
                                    "w-7 h-7 rounded-full transition-transform border-2",
                                    color === c && tool === 'pen' ? "scale-110 border-gray-400 ring-2 ring-blue-100" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>

                    {/* Tools */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setTool('pen')}
                            className={clsx(
                                "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                tool === 'pen' ? "bg-blue-50 text-blue-600 shadow-inner" : "text-gray-500 hover:bg-gray-100"
                            )}
                            title="قلم"
                        >
                            <Pen size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setTool('eraser')}
                            className={clsx(
                                "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                                tool === 'eraser' ? "bg-gray-100 text-gray-800 shadow-inner" : "text-gray-500 hover:bg-gray-100"
                            )}
                            title="ممحاة"
                        >
                            <Eraser size={18} />
                        </button>
                    </div>

                    <div className="w-px h-7 bg-gray-200 mx-1"></div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={handleUndo}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                            title="تراجع"
                        >
                            <Undo size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleRedo}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                            title="إعادة"
                        >
                            <Redo size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearPage}
                            className="w-9 h-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                            title="مسح الكل"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div ref={containerRef} className="flex-1 relative touch-none overflow-hidden">
                    <svg
                        ref={svgRef}
                        className="w-full h-full block cursor-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        {strokes.map((stroke, i) => (
                            <g key={i}>{renderStroke(stroke)}</g>
                        ))}
                        {currentStroke && (
                            <g>{renderStroke(currentStroke)}</g>
                        )}
                        {/* Eraser cursor circle */}
                        {tool === 'eraser' && cursorPos && (
                            <circle
                                cx={cursorPos.x}
                                cy={cursorPos.y}
                                r={25}
                                fill="none"
                                stroke="#666"
                                strokeWidth={2}
                                strokeDasharray="4 2"
                                pointerEvents="none"
                            />
                        )}
                    </svg>
                </div>

                {/* Note: Footer status bar could go here if needed */}
            </div>
        </div>
    );
};
