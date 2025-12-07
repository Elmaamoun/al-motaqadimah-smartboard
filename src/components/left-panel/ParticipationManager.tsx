import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Minus, UserPlus, Users, X, Search, Trash2, Crown, Edit2 } from 'lucide-react';
import clsx from 'clsx';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const POSITIVE_MESSAGES = ["أحسنت!", "رائع جداً!", "ممتاز!", "مبدع! استمر!"];
const NEUTRAL_MESSAGES = ["نذكّرك بالالتزام.", "يمكنك التحسن في المشاركة القادمة.", "سنرى منك الأفضل قريباً."];

export const ParticipationManager: React.FC = () => {
    const { students, addStudent, updateStudentPoints, groups, updateGroupPoints, isSoundEnabled, classStudents, updateGroupName, updateGroupLeader, deleteGroup } = useApp();
    const [newStudentName, setNewStudentName] = useState('');
    const [showClassListModal, setShowClassListModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [animatingId, setAnimatingId] = useState<string | null>(null);
    const [animationType, setAnimationType] = useState<'positive' | 'negative' | null>(null);
    const [overlayMessage, setOverlayMessage] = useState<{ text: string, type: 'positive' | 'negative' } | null>(null);

    const [activeTab, setActiveTab] = useState<'individual' | 'group'>('individual');
    const { width, height } = useWindowSize();

    // Group Leader Modal State
    const [leaderModalOpen, setLeaderModalOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // Audio Refs
    const positiveSoundRef = useRef<HTMLAudioElement | null>(null);
    const neutralSoundRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        positiveSoundRef.current = new Audio('/sounds/positive.mp3');
        neutralSoundRef.current = new Audio('/sounds/neutral.mp3');
    }, []);

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStudentName.trim()) {
            // Check for duplicate
            if (students.some(s => s.name === newStudentName.trim())) {
                alert("هذا الطالب مضاف بالفعل.");
                return;
            }
            addStudent(newStudentName.trim());
            setNewStudentName('');
        }
    };

    const handleAddFromClass = (name: string) => {
        if (students.some(s => s.name === name)) {
            alert("هذا الطالب مضاف بالفعل.");
            return;
        }
        addStudent(name);
        // Optional: Close modal or keep open for multiple adds
        // setShowClassListModal(false); 
    };

    const filteredClassStudents = classStudents.filter(name =>
        name.includes(searchTerm)
    );

    const handlePointUpdate = (id: string, delta: number, isGroup: boolean) => {
        if (isGroup) {
            updateGroupPoints(id, delta);
        } else {
            updateStudentPoints(id, delta);
        }

        // Trigger Animation & Sound
        setAnimatingId(id);
        setAnimationType(delta > 0 ? 'positive' : 'negative');

        if (delta > 0) {
            if (isSoundEnabled) positiveSoundRef.current?.play().catch(() => { });
            const randomMsg = POSITIVE_MESSAGES[Math.floor(Math.random() * POSITIVE_MESSAGES.length)];
            setOverlayMessage({ text: randomMsg, type: 'positive' });
        } else {
            if (isSoundEnabled) neutralSoundRef.current?.play().catch(() => { });
            const randomMsg = NEUTRAL_MESSAGES[Math.floor(Math.random() * NEUTRAL_MESSAGES.length)];
            setOverlayMessage({ text: randomMsg, type: 'negative' });
        }

        // Reset animation state
        setTimeout(() => {
            setAnimatingId(null);
            setAnimationType(null);
            setOverlayMessage(null);
        }, 3000);
    };



    return (
        <div className="flex flex-col h-full relative">
            {/* Overlay Message */}
            {overlayMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                    {overlayMessage.type === 'positive' && (
                        <div className="absolute inset-0 z-0">
                            <ReactConfetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.2} />
                        </div>
                    )}
                    <div className={clsx(
                        "bg-white/90 backdrop-blur-md p-10 rounded-3xl shadow-2xl transform transition-all animate-in zoom-in duration-300 border-4 relative z-10",
                        overlayMessage.type === 'positive' ? "border-green-500 text-green-700" : "border-red-500 text-red-700"
                    )}>
                        <h2 className="text-5xl font-black text-center mb-2">{overlayMessage.text}</h2>
                    </div>
                </div>
            )}



            {/* Sticky Header Section */}
            <div className="sticky top-0 bg-white z-10 pb-4">
                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 rounded-lg mb-4">
                    <button
                        onClick={() => setActiveTab('individual')}
                        className={clsx(
                            "flex-1 py-2 rounded-md font-bold text-lg transition-all",
                            activeTab === 'individual' ? "bg-white text-primary-blue shadow-sm" : "text-gray-600 hover:bg-gray-300"
                        )}
                    >
                        مشاركات فردية
                    </button>
                    <button
                        onClick={() => setActiveTab('group')}
                        className={clsx(
                            "flex-1 py-2 rounded-md font-bold text-lg transition-all",
                            activeTab === 'group' ? "bg-white text-primary-blue shadow-sm" : "text-gray-600 hover:bg-gray-300"
                        )}
                    >
                        مشاركات جماعية
                    </button>
                </div>

                {/* Fixed Top Controls for Individual Tab */}
                {activeTab === 'individual' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowClassListModal(true)}
                            className="w-full bg-blue-50 text-primary-blue border-2 border-dashed border-blue-200 rounded-xl p-3 flex items-center justify-center gap-2 font-bold hover:bg-blue-100 transition-colors"
                        >
                            <Users size={20} />
                            إضافة طالب من قائمة الفصل
                        </button>

                        <form onSubmit={handleAddStudent} className="flex gap-2">
                            <input
                                type="text"
                                value={newStudentName}
                                onChange={(e) => setNewStudentName(e.target.value)}
                                placeholder="اسم الطالب..."
                                className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-lg focus:outline-none focus:border-primary-blue font-medium"
                            />
                            <button
                                type="submit"
                                className="bg-primary-green text-white px-4 rounded-lg hover:bg-opacity-90"
                                title="إضافة طالب"
                            >
                                <UserPlus size={24} />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto pr-1 pb-2">

                {/* Individual Tab Content (List Only) */}
                {activeTab === 'individual' && (
                    <div className="space-y-3">
                        {students.length === 0 && (
                            <p className="text-center text-gray-400 py-8">لا يوجد طلاب مضافين</p>
                        )}
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className={clsx(
                                    "flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 transition-all duration-300",
                                    animatingId === student.id && animationType === 'positive' && "scale-105 bg-green-50 border-green-200 shadow-md",
                                    animatingId === student.id && animationType === 'negative' && "shake bg-red-50 border-red-200"
                                )}
                            >
                                <span className="font-bold text-gray-800 truncate ml-2 text-lg">{student.name}</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handlePointUpdate(student.id, 5, false)}
                                        className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
                                    <span className="min-w-[60px] text-center font-black text-xl text-gray-800">
                                        {student.points}
                                    </span>
                                    <button
                                        onClick={() => handlePointUpdate(student.id, -5, false)}
                                        className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                    >
                                        <Minus size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Group Tab Content */}
                {activeTab === 'group' && (
                    <div className="space-y-4">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className={clsx(
                                    "flex flex-col bg-gray-50 p-4 rounded-xl border border-gray-100 transition-all duration-300 gap-4",
                                    animatingId === group.id && animationType === 'positive' && "scale-105 bg-green-50 border-green-200 shadow-md",
                                    animatingId === group.id && animationType === 'negative' && "shake bg-red-50 border-red-200"
                                )}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        {/* Group Name */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={group.name}
                                                onChange={(e) => updateGroupName(group.id, e.target.value)}
                                                className="font-bold text-gray-800 text-xl bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-blue focus:outline-none w-full transition-colors"
                                                placeholder="اسم المجموعة"
                                            />
                                            <Edit2 size={16} className="text-gray-400 opacity-50" />
                                        </div>

                                        {/* Leader */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Crown size={16} className="text-yellow-500" />
                                            <span className="font-bold">القائد:</span>
                                            {group.leader ? (
                                                <button
                                                    onClick={() => { setSelectedGroupId(group.id); setLeaderModalOpen(true); }}
                                                    className="font-bold text-primary-blue underline hover:text-blue-700 truncate max-w-[120px]"
                                                >
                                                    {group.leader}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { setSelectedGroupId(group.id); setLeaderModalOpen(true); }}
                                                    className="bg-blue-100 text-primary-blue text-xs px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                                                >
                                                    تحديد قائد
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handlePointUpdate(group.id, 5, true)}
                                            className="w-12 h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                                        >
                                            <Plus size={24} />
                                        </button>
                                        <span className="min-w-[70px] text-center font-black text-3xl text-gray-800">
                                            {group.points}
                                        </span>
                                        <button
                                            onClick={() => handlePointUpdate(group.id, -5, true)}
                                            className="w-12 h-12 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                                        >
                                            <Minus size={24} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => deleteGroup(group.id)}
                                    className="self-end text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all opacity-60 hover:opacity-100"
                                    title="حذف المجموعة"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>



            {/* Class List Modal */}
            {showClassListModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">قائمة الفصل</h3>
                            <button onClick={() => setShowClassListModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute right-3 top-3 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="بحث عن طالب..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-2 pr-10 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-blue focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredClassStudents.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">لا يوجد طلاب مطابقين</p>
                            ) : (
                                filteredClassStudents.map((name, idx) => {
                                    const isAdded = students.some(s => s.name === name);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAddFromClass(name)}
                                            disabled={isAdded}
                                            className={clsx(
                                                "w-full text-right p-3 rounded-lg flex items-center justify-between transition-all",
                                                isAdded ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "hover:bg-blue-50 text-gray-700 hover:text-primary-blue"
                                            )}
                                        >
                                            <span className="font-medium">{name}</span>
                                            {isAdded ? (
                                                <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-500">مضاف</span>
                                            ) : (
                                                <Plus size={18} />
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Leader Selection Modal */}
            {leaderModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">اختيار قائد للمجموعة</h3>
                            <button onClick={() => setLeaderModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {classStudents.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">لا توجد قائمة طلاب للفصل الحالي</p>
                            ) : (
                                classStudents.map((name, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (selectedGroupId) {
                                                updateGroupLeader(selectedGroupId, name);
                                                setLeaderModalOpen(false);
                                            }
                                        }}
                                        className="w-full text-right p-3 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-primary-blue transition-all flex items-center gap-2"
                                    >
                                        <Crown size={16} className="text-gray-300" />
                                        <span className="font-medium">{name}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};
