import React, { useState, useRef, useEffect } from 'react';
import { getStroke } from 'perfect-freehand';
import { Eraser, Pen, Trash2, Undo } from 'lucide-react';
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

interface DrawingCanvasProps {
    initialData?: string;
    onUpdate?: (data: string) => void;
    height?: number;
    className?: string; // Applied to the wrapper
    placeholder?: string;
    simple?: boolean; // If true: black color only, simplified toolbar
    showToolbar?: boolean;
}

const COLORS = ['#000000', '#EF4444', '#22C55E', '#3B82F6'];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
    initialData,
    onUpdate,
    height = 150,
    className,
    placeholder,
    simple = false,
    showToolbar = true
}) => {
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [color, setColor] = useState('#000000');
    const [size] = useState(4);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const isLoaded = useRef(false);

    // Load initial data
    useEffect(() => {
        if (!isLoaded.current && initialData) {
            try {
                const parsed = JSON.parse(initialData);
                if (Array.isArray(parsed)) {
                    setStrokes(parsed);
                }
            } catch (e) {
                console.error("Failed to parse initial drawing data", e);
            }
            isLoaded.current = true;
        }
    }, [initialData]);

    // Notify parent of updates
    useEffect(() => {
        if (onUpdate && strokes.length > 0) {
            const timer = setTimeout(() => {
                onUpdate(JSON.stringify(strokes));
            }, 500); // Debounce
            return () => clearTimeout(timer);
        } else if (onUpdate && strokes.length === 0 && isLoaded.current) {
            // Handle clear
            onUpdate('');
        }
    }, [strokes, onUpdate]);

    // Reset color to black if simple mode changes to true
    useEffect(() => {
        if (simple) {
            setColor('#000000');
        }
    }, [simple]);

    const svgRef = useRef<SVGSVGElement>(null);

    const getSvgPoint = (e: React.PointerEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();

        // Direct coordinate mapping without scaling
        // This works correctly on Android smartboards
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
            color: tool === 'eraser' ? '#FFFFFF' : (simple ? '#000000' : color),
            size: tool === 'eraser' ? 20 : size,
            isEraser: tool === 'eraser',
        });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!currentStroke) return;
        e.preventDefault();
        const point = getSvgPoint(e);
        setCurrentStroke({
            ...currentStroke,
            points: [...currentStroke.points, point],
        });
    };

    const handlePointerUp = () => {
        if (!currentStroke) return;
        const newStrokes = [...strokes, currentStroke];
        setStrokes(newStrokes);
        setCurrentStroke(null);
    };

    const handleClear = () => {
        // Delete directly without confirmation
        setStrokes([]);
    };

    const handleUndo = () => {
        setStrokes(strokes.slice(0, -1));
    };

    const renderStroke = (stroke: Stroke) => {
        if (stroke.points.length < 2) return null;

        const points = stroke.points;

        // Build smooth path using quadratic bezier curves
        let pathData = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

        for (let i = 1; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];
            const midX = (current.x + next.x) / 2;
            const midY = (current.y + next.y) / 2;
            pathData += ` Q ${current.x.toFixed(1)} ${current.y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
        }

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
        <div className={className}>
            {/* Toolbar - Moved Outside */}
            {showToolbar && (
                <div className="flex items-center gap-1 mb-1 justify-end" dir="ltr">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
                        {!simple && tool === 'pen' && (
                            <div className="flex items-center gap-1 border-r pr-1 mr-1">
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={clsx(
                                            "w-4 h-4 rounded-full border",
                                            color === c ? "border-black scale-110" : "border-transparent"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}

                        {!simple && <div className="w-px h-4 bg-gray-300 mx-1" />}

                        <button
                            type="button"
                            onClick={() => setTool('pen')}
                            className={clsx("p-1 rounded", tool === 'pen' ? "bg-blue-100 text-blue-600" : "text-gray-500 hover:bg-gray-100")}
                            title="قلم"
                        >
                            <Pen size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setTool('eraser')}
                            className={clsx("p-1 rounded", tool === 'eraser' ? "bg-gray-200 text-gray-700" : "text-gray-500 hover:bg-gray-100")}
                            title="ممحاة"
                        >
                            <Eraser size={14} />
                        </button>

                        <div className="w-px h-4 bg-gray-300 mx-1" />

                        <button type="button" onClick={handleUndo} className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="تراجع">
                            <Undo size={14} />
                        </button>
                        <button type="button" onClick={handleClear} className="p-1 text-red-500 hover:bg-red-50 rounded" title="مسح">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div
                className="relative border border-slate-300 rounded-lg bg-white overflow-hidden select-none"
                style={{ height }}
            >
                {strokes.length === 0 && !currentStroke && placeholder && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-gray-300 text-sm">{placeholder}</span>
                    </div>
                )}

                <svg
                    ref={svgRef}
                    className="w-full h-full touch-none cursor-none"
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
        </div>
    );
};


