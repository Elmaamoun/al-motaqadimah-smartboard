import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { LeftPanel } from '../panels/LeftPanel';
import { CenterPanel } from '../panels/CenterPanel';
import { RightPanel } from '../panels/RightPanel';
import { GripVertical } from 'lucide-react';
import { TopBar } from './TopBar';

export const MainLayout: React.FC = () => {
    return (
        <div className="h-screen w-screen bg-gray-50 overflow-hidden flex flex-col">
            <TopBar />

            <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
                {/* First Panel (Visually Right in RTL) -> Should be Lesson Info / Whiteboard */}
                <Panel defaultSize={22} minSize={20} maxSize={40} className="border-l border-gray-200 smartboard-right overflow-y-auto">
                    <RightPanel />
                </Panel>

                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-primary-blue transition-colors flex items-center justify-center cursor-col-resize z-10">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </PanelResizeHandle>

                {/* Center Panel: PDF Viewer */}
                <Panel defaultSize={50} minSize={30} className="smartboard-center overflow-y-auto">
                    <CenterPanel />
                </Panel>

                <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-primary-blue transition-colors flex items-center justify-center cursor-col-resize z-10">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </PanelResizeHandle>

                {/* Last Panel (Visually Left in RTL) -> Should be Subjects & Participation */}
                <Panel defaultSize={20} minSize={15} maxSize={30} className="border-r border-gray-200 smartboard-left overflow-y-auto">
                    <LeftPanel />
                </Panel>
            </PanelGroup>
        </div>
    );
};
