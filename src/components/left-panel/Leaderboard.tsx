import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useApp } from '../../context/AppContext';
import { Trophy, Crown, Users, PartyPopper, X } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export const Leaderboard: React.FC = () => {
    const { students, groups } = useApp();
    const { width, height } = useWindowSize();
    const [showCelebration, setShowCelebration] = useState(false);

    const maxStudentPoints = students.length > 0 ? Math.max(...students.map(s => s.points)) : 0;
    const topStudents = students.filter(s => s.points === maxStudentPoints && s.points > 0);
    const topStudent = topStudents.length > 0 ? topStudents[0] : null;

    const maxGroupPoints = groups.length > 0 ? Math.max(...groups.map(g => g.points)) : 0;
    const topGroups = groups.filter(g => g.points === maxGroupPoints && g.points > 0);
    const topGroup = topGroups.length > 0 ? topGroups[0] : groups[0]; // fallback to first group for safety if none > 0, though we check > 0 later

    return (
        <div className="mt-auto pt-4 border-t border-gray-200">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" />
                لوحة الصدارة
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Top Student */}
                <div className="bg-gradient-to-br from-primary-blue to-brand-aqua text-white p-3 rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-1 opacity-20">
                        <Crown size={40} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-white font-semibold text-sm mb-1 opacity-95">الطالب المتميز</p>
                        <p className="font-bold text-base truncate text-white">
                            {topStudent ? topStudent.name : '-'}
                            {topStudents.length > 1 && <span className="text-xs font-normal opacity-80 mr-1">(+{topStudents.length - 1})</span>}
                        </p>
                        <p className="text-lg font-bold mt-1 font-mono bg-white/20 inline-block px-2 py-0.5 rounded text-white">
                            {topStudent ? topStudent.points : 0} نقاط
                        </p>
                    </div>
                </div>

                {/* Top Group */}
                <div className="bg-gradient-to-br from-primary-green to-emerald-500 text-white p-3 rounded-lg shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-1 opacity-20">
                        <Users size={40} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-white font-semibold text-sm mb-1 opacity-95">المجموعة المتميزة</p>
                        <p className="font-bold text-base truncate text-white">
                            {topGroup && topGroup.points > 0 ? topGroup.name : '-'}
                            {topGroups.length > 1 && <span className="text-xs font-normal opacity-80 mr-1">(+{topGroups.length - 1})</span>}
                        </p>
                        <p className="text-lg font-bold mt-1 font-mono bg-white/20 inline-block px-2 py-0.5 rounded text-white">
                            {topGroup && topGroup.points > 0 ? topGroup.points : 0} نقاط
                        </p>
                        {topGroup && topGroup.leader && (
                            <p className="text-xs mt-1 text-white/80 font-medium">
                                القائد: {topGroup.leader}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={() => setShowCelebration(true)}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-base font-semibold py-3 rounded-lg shadow hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
                <PartyPopper size={24} />
                الاحتفال بالمتميزين
            </button>

            {/* Celebration Overlay - Rendered via Portal to escape scale wrapper */}
            {showCelebration && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-primary-blue via-brand-aqua to-primary-green overflow-hidden">
                    <Confetti
                        width={width}
                        height={height}
                        recycle={true}
                        numberOfPieces={200}
                        colors={['#FFFFFF', '#FFD700', '#FFA500', '#FF69B4', '#87CEEB']}
                    />

                    <button
                        onClick={() => setShowCelebration(false)}
                        className="fixed top-4 right-4 text-white/80 hover:text-white bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors z-[10000]"
                    >
                        <X size={28} />
                    </button>

                    <div className="text-center text-white p-4 w-full max-w-4xl will-change-transform">
                        {/* Main Title */}
                        <h1 className="text-5xl font-black mb-2 text-yellow-300 drop-shadow-lg text-center">
                            أحسنتم! 🎉
                        </h1>
                        <p className="text-xl mb-6 text-white/90 text-center">مبروك للمتميزين</p>

                        {/* Cards Container */}
                        <div className="flex flex-row gap-6 justify-center items-stretch">
                            {/* Top Students */}
                            {topStudents.length > 0 && (
                                <div className="flex-1 max-w-md">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30 h-full">
                                        <Crown size={40} className="text-yellow-300 mx-auto mb-2" />
                                        <p className="text-base font-bold text-white mb-3">الطلاب المتميزون</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {topStudents.map((s, idx) => (
                                                <div key={idx} className="text-lg font-bold text-primary-blue bg-white px-4 py-1.5 rounded-full shadow-md">
                                                    {s.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Groups */}
                            {topGroups.length > 0 && (
                                <div className="flex-1 max-w-md">
                                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl border border-white/30 h-full">
                                        <Users size={40} className="text-yellow-300 mx-auto mb-2" />
                                        <p className="text-base font-bold text-white mb-3">المجموعات المتميزة</p>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {topGroups.map((g, idx) => (
                                                <div key={idx} className="text-lg font-bold text-primary-green bg-white px-4 py-1.5 rounded-full shadow-md">
                                                    {g.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
