import React from 'react';
import { LeftPanel } from '../panels/LeftPanel';
import { CenterPanel } from '../panels/CenterPanel';
import { RightPanel } from '../panels/RightPanel';
import { TopBar } from './TopBar';
import ResizableTriPane from './ResizableTriPane';

export const MainLayout: React.FC = () => {
    return (
        <div className="h-full w-full bg-gray-50 overflow-hidden flex flex-col">
            {/* Fixed Header */}
            <div className="flex-none z-50 relative">
                <TopBar />
            </div>

            {/* Main Resizable Layout */}
            <div className="flex-1 overflow-hidden relative z-10">
                <ResizableTriPane
                    storageKey="smartboard:triPane:v1"
                    left={<LeftPanel />}
                    center={<CenterPanel />}
                    right={<RightPanel />}
                />
            </div>
        </div>
    );
};
