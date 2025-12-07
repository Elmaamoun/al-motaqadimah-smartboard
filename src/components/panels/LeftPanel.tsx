import React from 'react';
import { ParticipationManager } from '../left-panel/ParticipationManager';
import { Leaderboard } from '../left-panel/Leaderboard';

export const LeftPanel: React.FC = () => {
    return (
        <div className="h-full bg-white p-4 flex flex-col overflow-hidden">
            <h2 className="text-xl font-bold text-primary-blue mb-4 border-b pb-2">المشاركة والتميز</h2>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {/* Main Content Area - Participation Manager takes available space */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
                    <ParticipationManager />
                </div>

                {/* Fixed Footer - Leaderboard */}
                <Leaderboard />
            </div>
        </div>
    );
};
