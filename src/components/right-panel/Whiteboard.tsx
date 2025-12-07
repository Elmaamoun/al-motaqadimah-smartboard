import React, { useState, useRef } from 'react';
import { getStroke } from 'perfect-freehand';
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

const COLORS = ['#000000', '#EF4444', '#22C55E', '#3B82F6'];
const SIZES = [4, 8, 12];

export const Whiteboard: React.FC = () => {
    const [pages, setPages] = useState<{ strokes: Stroke[], redoStack: Stroke[] }[]>([
        { strokes: [], redoStack: [] }
    ]);
    const [currentPage, setCurrentPage] = useState(0);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [color, setColor] = useState('#000000');
    const [size, setSize] = useState(4);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

    const svgRef = useRef<SVGSVGElement>(null);

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
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure,
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const point = getSvgPoint(e);
        setCurrentStroke({
            points: [point],
            color: tool === 'eraser' ? '#FFFFFF' : color,
            size: tool === 'eraser' ? 40 : size,
            isEraser: tool === 'eraser',
        });
        // Clear redo stack on new action
        updatePage(strokes, []);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!currentStroke) return;
        const point = getSvgPoint(e);
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
        if (window.confirm('هل أنت متأكد من مسح هذه الصفحة؟')) {
            updatePage([], []);
        }
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

    // Helper to render a stroke path
    const renderStroke = (stroke: Stroke) => {
        const outline = getStroke(stroke.points, {
            size: stroke.size,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
        });

        const pathData = outline.length > 0
            ? `M ${outline[0][0]} ${outline[0][1]} Q ${outline.slice(1).map(p => `${p[0]} ${p[1]}`).join(' ')} Z`
            : '';

        return (
            <path
                d={pathData}
                fill={stroke.color}
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

                {/* Toolbar - Floating, Equal Sizes, Icon Only */}
                <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur shadow-lg border border-gray-200 rounded-2xl p-2 flex items-center gap-2 z-20">

                    {/* Color Palette */}
                    <div className="flex items-center gap-2 pr-2 border-l border-gray-200 ml-2 order-2">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => { setColor(c); setTool('pen'); }}
                                className={clsx(
                                    "w-8 h-8 rounded-full transition-transform border-2",
                                    color === c && tool === 'pen' ? "scale-110 border-gray-400 ring-2 ring-blue-100" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>

                    {/* Tools */}
                    <div className="flex items-center gap-1 order-1">
                        <button
                            onClick={() => setTool('pen')}
                            className={clsx(
                                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                                tool === 'pen' ? "bg-blue-50 text-blue-600 shadow-inner" : "text-gray-500 hover:bg-gray-100"
                            )}
                            title="قلم"
                        >
                            <Pen size={20} />
                        </button>
                        <button
                            onClick={() => setTool('eraser')}
                            className={clsx(
                                "w-10 h-10 flex items-center justify-center rounded-xl transition-all",
                                tool === 'eraser' ? "bg-gray-100 text-gray-800 shadow-inner" : "text-gray-500 hover:bg-gray-100"
                            )}
                            title="ممحاة"
                        >
                            <Eraser size={20} />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-gray-200 mx-1 order-3"></div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 order-4">
                        <button
                            onClick={handleUndo}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                            title="تراجع"
                        >
                            <Undo size={20} />
                        </button>
                        <button
                            onClick={handleRedo}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
                            title="إعادة"
                        >
                            <Redo size={20} />
                        </button>
                        <button
                            onClick={handleClearPage}
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                            title="مسح الكل"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 relative cursor-crosshair touch-none overflow-hidden">
                    <svg
                        ref={svgRef}
                        className="w-full h-full block"
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
                    </svg>
                </div>

                {/* Note: Footer status bar could go here if needed */}
            </div>
        </div>
    );
};
