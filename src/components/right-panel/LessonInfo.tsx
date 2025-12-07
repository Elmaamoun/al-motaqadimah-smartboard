import React, { useState } from 'react';
import { useApp, SUBJECTS, type Subject } from '../../context/AppContext';
import { Calendar, BookOpen, FileText, Target, Plus, Trash2, Pen, Keyboard, RotateCcw, Wrench } from 'lucide-react';
import { DrawingCanvas } from '../common/DrawingCanvas';


export const LessonInfo: React.FC = () => {
    const { selectedSubject, setSelectedSubject, lessonSetup, setLessonSetup } = useApp();
    const [haqiba, setHaqiba] = useState('');

    const [isHaqibaDrawing, setIsHaqibaDrawing] = useState(false);

    // Toolbar visibility states
    const [lessonTitleToolbar, setLessonTitleToolbar] = useState(true);
    const [haqibaToolbar, setHaqibaToolbar] = useState(true);
    const [outcomeToolbars, setOutcomeToolbars] = useState<Record<number, boolean>>({});

    // Sync outcomes with context
    const outcomes = lessonSetup.outcomes || [];
    // Key: index of outcome, Value: boolean (true = handwriting mode)
    const [outcomeModes, setOutcomeModes] = useState<Record<number, boolean>>({});

    const setOutcomes = (newOutcomes: string[]) => {
        setLessonSetup({ ...lessonSetup, outcomes: newOutcomes });
    };

    // Update outcomes handler
    const handleOutcomeChange = (index: number, value: string) => {
        const newOutcomes = [...outcomes];
        newOutcomes[index] = value;
        setOutcomes(newOutcomes);
    };

    const addOutcome = () => {
        setOutcomes([...outcomes, '']);
    };

    const removeOutcome = (index: number) => {
        const newOutcomes = outcomes.filter((_, i) => i !== index);
        setOutcomes(newOutcomes);
    };

    return (
        <div className="h-full flex flex-col gap-6 p-1 overflow-y-auto">

            {/* Date */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-800 font-bold text-base mb-2">
                    <Calendar className="text-primary-blue" size={20} />
                    التاريخ
                </label>
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 font-bold text-lg text-gray-700 dir-ltr text-right">
                    {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join(' / ')}
                </div>
            </div>

            {/* Subject Dropdown */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-800 font-bold text-base mb-2">
                    <BookOpen className="text-primary-blue" size={20} />
                    المادة
                </label>
                <select
                    value={selectedSubject || ''}
                    onChange={(e) => setSelectedSubject(e.target.value as Subject)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent font-bold text-lg bg-white"
                >
                    <option value="" disabled>اختر مادة</option>
                    {SUBJECTS.map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))}
                </select>
            </div>

            {/* Lesson Title */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-slate-800 font-bold text-base mb-2">
                        <FileText className="text-primary-blue" size={20} />
                        موضوع الدرس
                    </label>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                        <button
                            onClick={() => setLessonSetup({ ...lessonSetup, lessonTitleMode: 'text' })}
                            className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${lessonSetup.lessonTitleMode !== 'drawing' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Keyboard size={14} />
                            كتابة
                        </button>
                        <button
                            onClick={() => setLessonSetup({ ...lessonSetup, lessonTitleMode: 'drawing' })}
                            className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${lessonSetup.lessonTitleMode === 'drawing' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Pen size={14} />
                            رسم
                        </button>
                    </div>

                </div>

                <div className={lessonSetup.lessonTitleMode === 'drawing' ? "block" : "hidden"}>
                    {/* Toolbar Toggle */}
                    <div className="flex justify-end mb-1">
                        <button
                            onClick={() => setLessonTitleToolbar(!lessonTitleToolbar)}
                            className="bg-gray-100 hover:bg-gray-200 text-slate-500 p-1 rounded transition-colors"
                            title={lessonTitleToolbar ? "إخفاء الأدوات" : "إظهار الأدوات"}
                        >
                            <Wrench size={14} />
                        </button>
                    </div>

                    <DrawingCanvas
                        className="w-full"
                        height={100}
                        placeholder="ارسم موضوع الدرس..."
                        simple={true}
                        initialData={lessonSetup.lessonTitleDrawing}
                        onUpdate={(data) => setLessonSetup({ ...lessonSetup, lessonTitleDrawing: data })}
                        showToolbar={lessonTitleToolbar}
                    />
                </div>

                <input
                    type="text"
                    value={lessonSetup.lessonTitle}
                    onChange={(e) => setLessonSetup({ ...lessonSetup, lessonTitle: e.target.value })}
                    placeholder="أدخل عنوان الدرس..."
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent font-bold text-lg ${lessonSetup.lessonTitleMode !== 'drawing' ? "block" : "hidden"}`}
                />
            </div>

            {/* Haqiba */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="flex items-center gap-2 text-slate-800 font-bold text-base mb-2">
                            <RotateCcw className="text-primary-blue" size={20} />
                            الحقبنة
                        </label>
                        <span className="text-xs text-slate-400 mr-8 block">ماذا تعلمنا سابقاً؟</span>
                    </div>
                    <div className="flex bg-gray-100 p-0.5 rounded-lg">
                        <button
                            onClick={() => setIsHaqibaDrawing(false)}
                            className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${!isHaqibaDrawing ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Keyboard size={14} />
                            كتابة
                        </button>
                        <button
                            onClick={() => setIsHaqibaDrawing(true)}
                            className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${isHaqibaDrawing ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Pen size={14} />
                            رسم
                        </button>
                    </div>
                </div>

                {/* Persistent Toggle for Haqiba */}
                <div className={isHaqibaDrawing ? "block" : "hidden"}>
                    {/* Toolbar Toggle */}
                    <div className="flex justify-end mb-1">
                        <button
                            onClick={() => setHaqibaToolbar(!haqibaToolbar)}
                            className="bg-gray-100 hover:bg-gray-200 text-slate-500 p-1 rounded transition-colors"
                            title={haqibaToolbar ? "إخفاء الأدوات" : "إظهار الأدوات"}
                        >
                            <Wrench size={14} />
                        </button>
                    </div>

                    <DrawingCanvas
                        className="w-full"
                        height={120}
                        placeholder="ارسم هنا..."
                        simple={true}
                        showToolbar={haqibaToolbar}
                    />
                </div>
                <textarea
                    value={haqiba}
                    onChange={(e) => setHaqiba(e.target.value)}
                    placeholder="ماذا تعلمنا سابقاً؟"
                    rows={3}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent font-bold text-lg resize-none ${!isHaqibaDrawing ? "block" : "hidden"}`}
                />
            </div>

            {/* Learning Outcomes - Fixed layout */}
            <div className="space-y-2 flex flex-col">
                <label className="flex items-center gap-2 text-slate-800 font-bold text-base mb-2 shrink-0">
                    <Target className="text-primary-blue" size={20} />
                    نواتج التعلم
                </label>

                <div className="space-y-3 pr-1">
                    {outcomes.map((outcome, index) => (
                        <div key={index} className="flex flex-col gap-2 p-1 border border-transparent hover:border-gray-200 rounded-lg transition-colors max-w-full overflow-hidden">
                            <div className="flex items-center gap-2">
                                <span className="bg-primary-green text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg shrink-0">
                                    {index + 1}
                                </span>
                                {/* Toggle for this specific outcome */}
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <button
                                        onClick={() => setOutcomeModes(prev => ({ ...prev, [index]: false }))}
                                        className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${!outcomeModes[index] ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Keyboard size={14} />
                                    </button>
                                    <button
                                        onClick={() => setOutcomeModes(prev => ({ ...prev, [index]: true }))}
                                        className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${outcomeModes[index] ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Pen size={14} />
                                    </button>
                                </div>

                                {outcomeModes[index] && (
                                    <button
                                        onClick={() => setOutcomeToolbars(prev => ({ ...prev, [index]: !prev[index] }))}
                                        className={`p-1.5 rounded transition-colors ${outcomeToolbars[index] !== false ? "bg-blue-50 text-blue-500" : "bg-gray-100 text-gray-400"}`}
                                        title={outcomeToolbars[index] !== false ? "إخفاء الأدوات" : "إظهار الأدوات"}
                                    >
                                        <Wrench size={14} />
                                    </button>
                                )}

                                <button
                                    onClick={() => removeOutcome(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-auto"
                                    title="حذف"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* Persistent Toggle for Outcome */}
                            <div className={`w-full ${outcomeModes[index] ? "block" : "hidden"}`}>
                                <DrawingCanvas
                                    className="w-full"
                                    height={100}
                                    placeholder="ارسم هنا..."
                                    simple={true}
                                    showToolbar={outcomeToolbars[index] !== false} // Default true
                                />
                            </div>
                            <input
                                type="text"
                                value={outcome}
                                onChange={(e) => handleOutcomeChange(index, e.target.value)}
                                placeholder={`الناتج ${index + 1}...`}
                                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent font-bold text-lg ${!outcomeModes[index] ? "block" : "hidden"}`}
                            />
                        </div>
                    ))}

                    <button
                        onClick={addOutcome}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-blue hover:text-primary-blue hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-bold"
                    >
                        <Plus size={20} />
                        إضافة ناتج تعلم
                    </button>
                </div>
            </div>
        </div >
    );
};
