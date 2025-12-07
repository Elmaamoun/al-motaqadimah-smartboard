import React from 'react';
import { SUBJECTS, useApp } from '../../context/AppContext';
import { clsx } from 'clsx';

export const SubjectSelector: React.FC = () => {
    const { selectedSubject, setSelectedSubject } = useApp();

    return (
        <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-2">المادة</h3>
            <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((subject) => (
                    <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={clsx(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                            selectedSubject === subject
                                ? "bg-primary-blue text-white border-primary-blue"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-primary-blue"
                        )}
                    >
                        {subject}
                    </button>
                ))}
            </div>
        </div>
    );
};
