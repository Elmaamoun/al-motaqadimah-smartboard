import React, { useState } from 'react';
import { LessonInfo } from '../right-panel/LessonInfo';
import { Whiteboard } from '../right-panel/Whiteboard';
import { PenTool, Info } from 'lucide-react';

export const RightPanel: React.FC = () => {
    const [mode, setMode] = useState<'info' | 'whiteboard'>('info');

    return (
        <div className="h-full bg-white p-4 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-brand-purple">
                    {mode === 'info' ? 'معلومات الدرس' : 'السبورة البيضاء'}
                </h2>
                <button
                    onClick={() => setMode(mode === 'info' ? 'whiteboard' : 'info')}
                    className="text-sm bg-brand-aqua text-white px-3 py-1.5 rounded flex items-center gap-2 hover:bg-opacity-90 transition-colors shadow-sm"
                >
                    {mode === 'info' ? (
                        <>
                            <PenTool size={16} />
                            السبورة البيضاء
                        </>
                    ) : (
                        <>
                            <Info size={16} />
                            معلومات الدرس
                        </>
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {mode === 'info' ? <LessonInfo /> : <Whiteboard />}
            </div>
        </div>
    );
};
