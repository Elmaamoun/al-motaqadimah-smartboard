import React, { useRef, useState } from 'react';
import { useApp, SUBJECTS } from '../../context/AppContext';
import { Upload, Play, BookOpen, GraduationCap, FileText, Layers, Calendar, Users, Info, X } from 'lucide-react';
import { DrawingCanvas } from '../common/DrawingCanvas';

export const SetupScreen: React.FC = () => {
    const { lessonSetup, setLessonSetup, startSession, setPdfFile, pdfFile, loadClassStudents } = useApp();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    const handleChange = (field: keyof typeof lessonSetup, value: string) => {
        setLessonSetup({ ...lessonSetup, [field]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, boolean> = {};
        let hasError = false;

        const requiredFields = ['stage', 'system', 'grade', 'className', 'term', 'subject', 'lessonTitle'];
        requiredFields.forEach(field => {
            if (!lessonSetup[field as keyof typeof lessonSetup]) {
                if (field === 'lessonTitle' && lessonSetup.lessonTitleMode === 'drawing' && lessonSetup.lessonTitleDrawing) {
                    // Allow if drawing is present for lessonTitle
                    return;
                }
                newErrors[field] = true;
                hasError = true;
            }
        });

        if (!pdfFile) {
            newErrors['pdfFile'] = true;
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            setGeneralError("يرجى إكمال البيانات قبل بدء الحصة");
            return;
        }

        loadClassStudents(lessonSetup.stage, lessonSetup.grade, lessonSetup.className);
        startSession();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* Branding Side */}
                <div className="bg-primary-blue text-white p-10 md:w-1/3 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 pattern-grid-lg opacity-20"></div>
                    <img src="/logo.png" alt="School Logo" className="max-w-[180px] h-auto object-contain mb-8 relative z-10" />
                    <h1 className="text-4xl font-bold mb-4 relative z-10">مدارس المتقدمة</h1>
                    <p className="text-blue-100 text-xl relative z-10">بوابة المستقبل التعليمية</p>
                    <div className="mt-16 space-y-4 opacity-80 text-base relative z-10">
                        <p>نظام إدارة الحصص الذكي</p>
                        <p>الإصدار 1.0</p>
                    </div>

                    <button
                        onClick={() => setShowAboutModal(true)}
                        className="mt-8 text-white/80 hover:text-white text-sm underline decoration-white/30 hover:decoration-white transition-all relative z-10 flex items-center gap-2"
                    >
                        <Info size={16} />
                        حول التطبيق
                    </button>
                </div>

                {/* Form Side */}
                <div className="p-10 md:w-2/3 flex flex-col justify-center">
                    <div className="mb-8 border-b pb-4">
                        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3 mb-2">
                            <GraduationCap className="text-primary-blue" size={32} />
                            تهيئة الدرس
                        </h2>
                        <p className="text-gray-500 text-lg">اختر بيانات الحصة وملف الكتاب قبل بدء الدرس.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Row 1: Stage + System */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-base font-semibold text-slate-700">المرحلة الدراسية</label>
                                <select
                                    value={lessonSetup.stage}
                                    onChange={(e) => handleChange('stage', e.target.value)}
                                    className={`w-full p-3 text-lg border rounded-xl shadow-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent py-2 ${errors.stage ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                >
                                    <option value="">اختر المرحلة</option>
                                    <option value="ابتدائي">ابتدائي</option>
                                    <option value="متوسط">متوسط</option>
                                    <option value="ثانوي">ثانوي</option>
                                </select>
                                {errors.stage && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-base font-semibold text-slate-700">النظام</label>
                                <select
                                    value={lessonSetup.system}
                                    onChange={(e) => handleChange('system', e.target.value)}
                                    className={`w-full p-3 text-lg border rounded-xl shadow-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent py-2 ${errors.system ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                >
                                    <option value="عام">عام</option>
                                    <option value="تحفيظ">تحفيظ</option>
                                </select>
                                {errors.system && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                            </div>
                        </div>

                        {/* Row 2: Grade + Class */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-base font-semibold text-slate-700">الصف</label>
                                <select
                                    value={lessonSetup.grade}
                                    onChange={(e) => handleChange('grade', e.target.value)}
                                    className={`w-full p-3 text-lg border rounded-xl shadow-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent py-2 ${errors.grade ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                >
                                    <option value="">اختر الصف</option>
                                    <option value="الصف الأول">الصف الأول</option>
                                    <option value="الصف الثاني">الصف الثاني</option>
                                    <option value="الصف الثالث">الصف الثالث</option>
                                    <option value="الصف الرابع">الصف الرابع</option>
                                    <option value="الصف الخامس">الصف الخامس</option>
                                    <option value="الصف السادس">الصف السادس</option>
                                </select>
                                {errors.grade && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-base font-semibold text-slate-700">الفصل</label>
                                <div className="relative">
                                    <Users className="absolute right-3 top-3.5 text-gray-400" size={20} />
                                    <select
                                        value={lessonSetup.className}
                                        onChange={(e) => handleChange('className', e.target.value)}
                                        className={`w-full p-3 pr-10 text-lg border rounded-xl shadow-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent py-2 appearance-none ${errors.className ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                    >
                                        <option value="">اختر الفصل</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                    </select>
                                </div>
                                {errors.className && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                            </div>
                        </div>

                        {/* Row 3: Term + Subject */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-base font-semibold text-slate-700">الفصل الدراسي</label>
                                <div className="relative">
                                    <Calendar className="absolute right-3 top-3.5 text-gray-400" size={20} />
                                    <select
                                        value={lessonSetup.term}
                                        onChange={(e) => handleChange('term', e.target.value)}
                                        className={`w-full p-3 pr-10 text-lg border rounded-xl shadow-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent py-2 appearance-none ${errors.term ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                    >
                                        <option value="">اختر الفصل الدراسي</option>
                                        <option value="الفصل الدراسي الأول">الفصل الدراسي الأول</option>
                                        <option value="الفصل الدراسي الثاني">الفصل الدراسي الثاني</option>
                                    </select>
                                </div>
                                {errors.term && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="block text-base font-semibold text-slate-700">المادة</label>
                                <div className="relative">
                                    <BookOpen className="absolute right-3 top-3.5 text-gray-400" size={20} />
                                    <select
                                        value={lessonSetup.subject}
                                        onChange={(e) => handleChange('subject', e.target.value)}
                                        className={`w-full p-3 pr-10 text-lg border rounded-xl shadow-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent py-2 appearance-none ${errors.subject ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                    >
                                        <option value="">اختر المادة</option>
                                        {SUBJECTS.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                {errors.subject && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                            </div>
                        </div>

                        {/* Row 4: Unit */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-base font-semibold text-slate-700">الوحدة الدراسية <span className="text-slate-400 text-sm font-normal">(اختياري)</span></label>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => handleChange('unitMode', 'text')}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${lessonSetup.unitMode === 'text' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                                    >
                                        كتابة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('unitMode', 'drawing')}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${lessonSetup.unitMode === 'drawing' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                                    >
                                        رسم
                                    </button>
                                </div>
                            </div>

                            <div className={lessonSetup.unitMode === 'drawing' ? "block" : "hidden"}>
                                <DrawingCanvas
                                    height={80}
                                    placeholder="ارسم اسم الوحدة..."
                                    simple={true}
                                    initialData={lessonSetup.unitDrawing}
                                    onUpdate={(data) => handleChange('unitDrawing', data)}
                                    className="w-full bg-white"
                                />
                            </div>

                            <div className={`relative ${lessonSetup.unitMode !== 'drawing' ? "block" : "hidden"}`}>
                                <Layers className="absolute right-3 top-3.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={lessonSetup.unit}
                                    onChange={(e) => handleChange('unit', e.target.value)}
                                    placeholder="اسم الوحدة..."
                                    className={`w-full p-3 pr-10 text-lg border rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent ${errors.unit ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                />
                            </div>
                        </div>

                        {/* Row 5: Lesson Title */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-base font-semibold text-slate-700">موضوع الدرس</label>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => handleChange('lessonTitleMode', 'text')}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${lessonSetup.lessonTitleMode === 'text' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                                    >
                                        كتابة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleChange('lessonTitleMode', 'drawing')}
                                        className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${lessonSetup.lessonTitleMode === 'drawing' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                                    >
                                        رسم
                                    </button>
                                </div>
                            </div>

                            <div className={lessonSetup.lessonTitleMode === 'drawing' ? "block" : "hidden"}>
                                <DrawingCanvas
                                    height={80}
                                    placeholder="ارسم موضوع الدرس..."
                                    simple={true}
                                    initialData={lessonSetup.lessonTitleDrawing}
                                    onUpdate={(data) => handleChange('lessonTitleDrawing', data)}
                                    className="w-full bg-white"
                                />
                            </div>

                            <div className={`relative ${lessonSetup.lessonTitleMode !== 'drawing' ? "block" : "hidden"}`}>
                                <FileText className="absolute right-3 top-3.5 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={lessonSetup.lessonTitle}
                                    onChange={(e) => handleChange('lessonTitle', e.target.value)}
                                    placeholder="عنوان الدرس..."
                                    className={`w-full p-3 pr-10 text-lg border rounded-xl focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent font-bold ${errors.lessonTitle ? 'border-red-600 bg-red-50' : 'border-[#D1D5DB] bg-[#F3F4F6]'}`}
                                />
                            </div>
                            {errors.lessonTitle && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                        </div>

                        {/* Row 6: PDF Upload */}
                        <div className="space-y-2">
                            <label className="block text-base font-semibold text-slate-700">ملف الدرس (PDF)</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 flex items-center justify-center gap-4 cursor-pointer hover:border-primary-blue hover:bg-blue-50 transition-all group ${errors.pdfFile ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}
                            >
                                <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white transition-colors">
                                    <Upload className="text-gray-500 group-hover:text-primary-blue" size={24} />
                                </div>
                                <span className="text-gray-600 font-medium text-lg">
                                    {pdfFile ? pdfFile.name : 'اضغط لاختيار ملف الكتاب المدرسي (PDF)'}
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx,.pptx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                            {errors.pdfFile && <p className="text-red-600 text-sm mt-1">برجاء تعبئة هذه الخانة</p>}
                        </div>

                        <div className="space-y-2">
                            {generalError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center font-bold">
                                    {generalError}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-primary-green text-white font-bold py-4 rounded-xl shadow-lg hover:bg-opacity-90 hover:shadow-xl transition-all flex items-center justify-center gap-3 text-xl mt-6 transform hover:-translate-y-1"
                            >
                                <Play size={28} fill="currentColor" />
                                ابدأ الحصة
                            </button>
                        </div>

                    </form>
                </div>
            </div>

            {/* About Modal */}
            {showAboutModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowAboutModal(false)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-blue">
                                <Info size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">نظام إدارة الحصة الذكي</h2>
                            <p className="text-gray-500 mb-6">مدارس المتقدمة</p>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 space-y-2">
                                <p>الإصدار: <span className="font-bold text-gray-800">v1.0.0</span></p>
                                <p>تم التطوير بواسطة:</p>
                                <p className="font-bold text-primary-blue text-base">Ahmed Elmaamoun</p>
                                <p className="text-xs text-gray-400">© 2025 All rights reserved.</p>
                            </div>

                            <p className="text-gray-500 text-sm leading-relaxed">
                                تطبيق تفاعلي لإدارة الحصص الدراسية، يجمع بين أدوات العرض التفاعلية، إدارة الوقت، وتحفيز الطلاب في بيئة تعليمية متكاملة.
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center">
                            <button
                                onClick={() => setShowAboutModal(false)}
                                className="bg-primary-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
