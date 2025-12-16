import React, { useState } from 'react';
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

            {/* Celebration Overlay */}
            {showCelebration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto">
                    <Confetti
                        width={width}
                        height={height}
                        recycle={true}
                        numberOfPieces={500}
                        colors={['#007FA3', '#8EC63F', '#00A8C9', '#FFD700', '#FFFFFF']}
                    />

                    <button
                        onClick={() => setShowCelebration(false)}
                        className="fixed top-8 right-8 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-[60]"
                    >
                        <X size={32} />
                    </button>

                    <div className="text-center text-white animate-bounce-in p-8 w-full max-w-5xl">
                        <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-lg">
                            أحسنتم!
                        </h1>
                        <p className="text-2xl mb-12 opacity-90">مبروك للمتميزين</p>

                        <div className="flex flex-col md:flex-row gap-12 justify-center items-start">
                            {/* Top Students */}
                            {topStudents.length > 0 && (
                                <div className="flex-1 w-full">
                                    <div className="bg-white/10 backdrop-blur p-8 rounded-2xl border border-white/20 transform hover:scale-105 transition-transform">
                                        <Crown size={64} className="text-yellow-400 mx-auto mb-4" />
                                        <p className="text-xl opacity-80 mb-4">الطلاب المتميزون</p>
                                        <div className="flex flex-wrap gap-3 justify-center">
                                            {topStudents.map((s, idx) => (
                                                <div key={idx} className="text-4xl font-bold text-primary-blue bg-white px-6 py-2 rounded-full shadow-lg">
                                                    {s.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Top Groups */}
                            {topGroups.length > 0 && (
                                <div className="flex-1 w-full">
                                    <div className="bg-white/10 backdrop-blur p-8 rounded-2xl border border-white/20 transform hover:scale-105 transition-transform">
                                        <Users size={64} className="text-green-400 mx-auto mb-4" />
                                        <p className="text-xl opacity-80 mb-4">المجموعات المتميزة</p>
                                        <div className="flex flex-col gap-4">
                                            {topGroups.map((g, idx) => (
                                                <div key={idx} className="flex flex-col items-center p-2 rounded-xl bg-white/5">
                                                    <p className="text-4xl font-bold text-primary-green bg-white px-6 py-2 rounded-full shadow-lg mb-2">
                                                        {g.name}
                                                    </p>
                                                    {g.leader && (
                                                        <p className="text-lg opacity-80 text-white">
                                                            القائد: {g.leader}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
