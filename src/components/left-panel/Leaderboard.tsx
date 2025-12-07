import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Crown, Users, PartyPopper, X } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export const Leaderboard: React.FC = () => {
    const { students, groups } = useApp();
    const { width, height } = useWindowSize();
    const [showCelebration, setShowCelebration] = useState(false);

    const topStudent = students.length > 0
        ? [...students].sort((a, b) => b.points - a.points)[0]
        : null;

    const topGroup = [...groups].sort((a, b) => b.points - a.points)[0];

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
                            {topStudent && topStudent.points > 0 ? topStudent.name : '-'}
                        </p>
                        <p className="text-lg font-bold mt-1 font-mono bg-white/20 inline-block px-2 py-0.5 rounded text-white">
                            {topStudent && topStudent.points > 0 ? topStudent.points : 0} نقاط
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
                            {topGroup.points > 0 ? topGroup.name : '-'}
                        </p>
                        <p className="text-lg font-bold mt-1 font-mono bg-white/20 inline-block px-2 py-0.5 rounded text-white">
                            {topGroup.points > 0 ? topGroup.points : 0} نقاط
                        </p>
                        {topGroup.leader && (
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <Confetti
                        width={width}
                        height={height}
                        recycle={true}
                        numberOfPieces={500}
                        colors={['#007FA3', '#8EC63F', '#00A8C9', '#FFD700', '#FFFFFF']}
                    />

                    <button
                        onClick={() => setShowCelebration(false)}
                        className="absolute top-8 right-8 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                        <X size={32} />
                    </button>

                    <div className="text-center text-white animate-bounce-in">
                        <h1 className="text-6xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-lg">
                            أحسنتم!
                        </h1>
                        <p className="text-2xl mb-12 opacity-90">مبروك للطالب المتميز والمجموعة المتميزة</p>

                        <div className="flex gap-12 justify-center">
                            <div className="bg-white/10 backdrop-blur p-8 rounded-2xl border border-white/20 transform hover:scale-105 transition-transform">
                                <Crown size={64} className="text-yellow-400 mx-auto mb-4" />
                                <p className="text-xl opacity-80 mb-2">الطالب المتميز</p>
                                <p className="text-4xl font-bold text-primary-blue bg-white px-6 py-2 rounded-full">
                                    {topStudent && topStudent.points > 0 ? topStudent.name : '-'}
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur p-8 rounded-2xl border border-white/20 transform hover:scale-105 transition-transform">
                                <Users size={64} className="text-green-400 mx-auto mb-4" />
                                <p className="text-xl opacity-80 mb-2">المجموعة المتميزة</p>
                                <p className="text-4xl font-bold text-primary-green bg-white px-6 py-2 rounded-full">
                                    {topGroup.points > 0 ? topGroup.name : '-'}
                                </p>
                                {topGroup.leader && (
                                    <p className="text-lg opacity-80 mt-2 text-white">
                                        القائد: {topGroup.leader}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
