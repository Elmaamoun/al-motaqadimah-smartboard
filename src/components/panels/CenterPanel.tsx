import React from 'react';
import { PDFViewer } from './PDFViewer';

export const CenterPanel: React.FC = () => {
    return (
        <div className="h-full w-full overflow-hidden">
            <PDFViewer />
        </div>
    );
};
