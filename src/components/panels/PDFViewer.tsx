import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Upload, Pen, Eraser, Undo, Monitor, FileText } from 'lucide-react';
import { useApp, type Stroke, type Point } from '../../context/AppContext';
import { useAppScale } from '../../utils/useAppScale';
import { getStroke } from 'perfect-freehand';
import clsx from 'clsx';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PDFViewerContentProps {
    pdfFile: File | null;
    setPdfFile: (file: File | null) => void;
    annotations: Record<number, Stroke[]>;
    setAnnotations: (annotations: Record<number, Stroke[]>) => void;
    isAnnotationMode: boolean;
    setIsAnnotationMode: (isMode: boolean) => void;
}

const PDFViewerContent: React.FC<PDFViewerContentProps> = React.memo(({
    pdfFile,
    setPdfFile,
    annotations,
    setAnnotations,
    isAnnotationMode,
    setIsAnnotationMode
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.55); // Default to 155% as requested
    const [pageInput, setPageInput] = useState<string>('1');
    const [isAutoFitEnabled, setIsAutoFitEnabled] = useState<boolean>(false); // Smart auto-fit

    // Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [scrollPos, setScrollPos] = useState({ left: 0, top: 0 });

    // Annotation State
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#EF4444'); // Default red for corrections

    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            setPdfFile(files[0]);
            setPageNumber(1);
            setPageInput('1');
            setAnnotations({}); // Clear annotations on new file
        }
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
        setPageInput('1');
    };

    const changePage = (offset: number) => {
        setPageNumber((prevPageNumber) => {
            const newPage = Math.min(Math.max(1, prevPageNumber + offset), numPages);
            setPageInput(newPage.toString());
            return newPage;
        });
    };

    const handlePageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const page = parseInt(pageInput);
        if (!isNaN(page) && page >= 1 && page <= numPages) {
            setPageNumber(page);
        } else {
            setPageInput(pageNumber.toString());
        }
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const page = parseInt(e.target.value);
        setPageNumber(page);
        setPageInput(page.toString());
    };

    const handleFitWidth = () => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.clientWidth;
            // Assume A4 approx 800px width at 100% or just fit available space
            // Defaulting to a safe calculation where 1.0 = full width of typical document
            // If container is 800px, scale 1.0. If 400px, scale 0.5.
            setScale((containerWidth - 40) / 800);
            setIsAutoFitEnabled(true); // Enable auto-fit on Fit Width click
        }
    };

    useEffect(() => {
        if (!containerRef.current || !pdfFile) return;

        // Smart ResizeObserver: only auto-scales when isAutoFitEnabled is true
        const resizeObserver = new ResizeObserver(() => {
            if (isAutoFitEnabled && containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                setScale((containerWidth - 40) / 800);
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [pdfFile, isAutoFitEnabled]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isAnnotationMode) return;
        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
        if (containerRef.current) {
            setScrollPos({ left: containerRef.current.scrollLeft, top: containerRef.current.scrollTop });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        containerRef.current.scrollLeft = scrollPos.left - dx;
        containerRef.current.scrollTop = scrollPos.top - dy;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // --- Annotation Logic ---

    const getSvgPoint = (e: React.PointerEvent): Point => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();

        // Direct coordinate mapping without scaling
        // This works correctly on Android smartboards
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure,
        };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isAnnotationMode) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        const point = getSvgPoint(e);

        if (tool === 'eraser') {
            setCurrentStroke({
                points: [point],
                color: 'transparent',
                size: 20,
                isEraser: true,
            });
        } else {
            setCurrentStroke({
                points: [point],
                color: color,
                size: 4,
                isEraser: false,
            });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isAnnotationMode || !currentStroke) return;
        const point = getSvgPoint(e);
        const newPoints = [...currentStroke.points, point];
        setCurrentStroke({ ...currentStroke, points: newPoints });

        if (tool === 'eraser') {
            const pageStrokes = annotations[pageNumber] || [];
            const remainingStrokes = pageStrokes.filter(stroke => {
                return !stroke.points.some(p => Math.hypot(p.x - point.x, p.y - point.y) < 20);
            });

            if (remainingStrokes.length !== pageStrokes.length) {
                setAnnotations({
                    ...annotations,
                    [pageNumber]: remainingStrokes,
                });
            }
        }
    };

    const handlePointerUp = () => {
        if (!isAnnotationMode || !currentStroke) return;

        if (tool !== 'eraser') {
            const pageStrokes = annotations[pageNumber] || [];
            setAnnotations({
                ...annotations,
                [pageNumber]: [...pageStrokes, currentStroke],
            });
        }
        setCurrentStroke(null);
    };

    const handleUndo = () => {
        const pageStrokes = annotations[pageNumber] || [];
        if (pageStrokes.length === 0) return;
        setAnnotations({
            ...annotations,
            [pageNumber]: pageStrokes.slice(0, -1),
        });
    };

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
                fillOpacity={0.8}
            />
        );
    };

    const fileUrl = React.useMemo(() => {
        if (!pdfFile) return null;
        return URL.createObjectURL(pdfFile);
    }, [pdfFile]);

    const fileType = React.useMemo(() => {
        if (!pdfFile) return 'none';
        const name = pdfFile.name.toLowerCase();
        if (name.endsWith('.pdf')) return 'pdf';
        if (name.match(/\.(png|jpg|jpeg|webp)$/)) return 'image';
        if (name.match(/\.(mp4|webm)$/)) return 'video';
        return 'unknown';
    }, [pdfFile]);

    return (
        <div className="h-full flex flex-col bg-gray-100">
            {/* Toolbar */}
            <div className="bg-white p-2 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-lg cursor-pointer hover:bg-opacity-90 transition-colors font-bold">
                        <Upload size={20} />
                        <span>فتح ملف</span>
                        <input type="file" onChange={onFileChange} accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.mp4,.webm" className="hidden" />
                    </label>
                </div>

                {fileType === 'pdf' && (
                    <>
                        {/* Annotation Tools */}
                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200 mx-2">
                            <button
                                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-md font-bold text-sm transition-colors flex items-center gap-2",
                                    isAnnotationMode ? "bg-brand-purple text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                )}
                            >
                                <Pen size={16} />
                                {isAnnotationMode ? 'وضع الشرح (مفعل)' : 'وضع الشرح'}
                            </button>

                            {isAnnotationMode && (
                                <>
                                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                                    <button
                                        onClick={() => { setTool('pen'); setColor('#EF4444'); }}
                                        className={clsx("w-6 h-6 rounded-full bg-red-500 border-2", tool === 'pen' && color === '#EF4444' ? "border-gray-900" : "border-transparent")}
                                    />
                                    <button
                                        onClick={() => { setTool('pen'); setColor('#3B82F6'); }}
                                        className={clsx("w-6 h-6 rounded-full bg-blue-500 border-2", tool === 'pen' && color === '#3B82F6' ? "border-gray-900" : "border-transparent")}
                                    />
                                    <button
                                        onClick={() => setTool('eraser')}
                                        className={clsx("p-1.5 rounded hover:bg-gray-200", tool === 'eraser' ? "bg-gray-300" : "")}
                                        title="ممحاة"
                                    >
                                        <Eraser size={18} />
                                    </button>
                                    <button onClick={handleUndo} className="p-1.5 rounded hover:bg-gray-200" title="تراجع">
                                        <Undo size={18} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-4 bg-gray-50 px-4 py-1 rounded-lg border border-gray-200">
                            <button
                                onClick={() => changePage(-1)}
                                disabled={pageNumber <= 1}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                                <ChevronRight size={24} />
                            </button>

                            <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium">الصفحة</span>
                                <input
                                    type="text"
                                    value={pageInput}
                                    onChange={(e) => setPageInput(e.target.value)}
                                    className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-primary-blue font-bold"
                                />
                                <span className="text-gray-600 font-medium">من {numPages}</span>
                            </form>

                            <button
                                onClick={() => changePage(1)}
                                disabled={pageNumber >= numPages}
                                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        </div>

                        {/* Zoom */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setScale(s => Math.max(0.5, s - 0.1)); setIsAutoFitEnabled(false); }}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="w-12 text-center font-mono font-bold text-gray-700">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={() => { setScale(s => Math.min(3.0, s + 0.1)); setIsAutoFitEnabled(false); }}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            >
                                <ZoomIn size={20} />
                            </button>
                            <button
                                onClick={handleFitWidth}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                                title="Fit Width"
                            >
                                <Monitor size={20} />
                            </button>
                            <button
                                onClick={() => { setScale(1.0); setIsAutoFitEnabled(false); }}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                                title="الحجم الأصلي"
                            >
                                <Maximize size={20} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Page Slider */}
            {fileType === 'pdf' && (
                <div className="bg-white px-4 py-1 border-b border-gray-200">
                    <input
                        type="range"
                        min="1"
                        max={numPages}
                        value={pageNumber}
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-blue"
                    />
                </div>
            )}

            {/* Content */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto bg-gray-200 relative flex flex-col m-2 rounded-lg border border-slate-200 shadow-inner scrollbar-slim-neutral"
                style={{
                    cursor: isAnnotationMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
                    userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {!pdfFile ? (
                    <div className="flex flex-col items-center justify-center text-gray-400 m-auto">
                        <Upload size={64} className="mb-4 opacity-50" />
                        <p className="text-xl font-medium">الرجاء اختيار ملف للعرض</p>
                    </div>
                ) : (
                    <>
                        {fileType === 'unknown' && (
                            <div className="flex flex-col items-center justify-center text-gray-400 m-auto p-8 text-center">
                                <FileText size={64} className="mb-4 opacity-50" />
                                <p className="text-xl font-medium mb-2">نوع الملف غير مدعوم للمعاينة المباشرة</p>
                                <p className="text-sm opacity-70">({pdfFile.name})</p>
                                <p className="mt-4 text-sm bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg border border-yellow-200">
                                    يدعم النظام حالياً عرض ملفات PDF والصور والفيديو فقط.
                                </p>
                            </div>
                        )}

                        {fileType === 'image' && fileUrl && (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img src={fileUrl} alt="Content" className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                            </div>
                        )}

                        {fileType === 'video' && fileUrl && (
                            <div className="w-full h-full flex items-center justify-center p-4 bg-black">
                                <video src={fileUrl} controls className="max-w-full max-h-full outline-none rounded-lg" />
                            </div>
                        )}

                        {fileType === 'pdf' && (
                            <div className="relative shadow-2xl m-auto p-8">
                                <Document
                                    file={pdfFile}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="bg-white"
                                    />
                                </Document>
                                {/* Annotation Overlay */}
                                <svg
                                    ref={svgRef}
                                    className="absolute inset-0 w-full h-full touch-none z-10 pointer-events-auto cursor-none"
                                    style={{ pointerEvents: isAnnotationMode ? 'auto' : 'none', top: 32, left: 32, right: 32, bottom: 32 }}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerLeave={handlePointerUp}

                                >

                                    {(annotations[pageNumber] || []).map((stroke, i) => (
                                        <g key={i}>{renderStroke(stroke)}</g>
                                    ))}
                                    {currentStroke && !currentStroke.isEraser && (
                                        <g>{renderStroke(currentStroke)}</g>
                                    )}
                                </svg>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

export const PDFViewer: React.FC = () => {
    const { pdfFile, setPdfFile, annotations, setAnnotations, isAnnotationMode, setIsAnnotationMode } = useApp();
    return (
        <PDFViewerContent
            pdfFile={pdfFile}
            setPdfFile={setPdfFile}
            annotations={annotations}
            setAnnotations={setAnnotations}
            isAnnotationMode={isAnnotationMode}
            setIsAnnotationMode={setIsAnnotationMode}
        />
    );
};



