import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import studentsData from '../data/students.json';

export type Subject = 'لغة عربية' | 'قرآن كريم' | 'نور البيان' | 'English' | 'علوم' | 'رياضيات' | 'إسلاميات' | 'اجتماعيات' | 'رقمية';

export const SUBJECTS: Subject[] = [
    'لغة عربية', 'قرآن كريم', 'نور البيان', 'English', 'علوم', 'رياضيات', 'إسلاميات', 'اجتماعيات', 'رقمية'
];

export interface LessonSetup {
    stage: string;
    system: string; // 'عام' | 'تحفيظ'
    grade: string;
    className: string;
    term: string;
    subject: string;
    unit: string;
    lessonTitle: string;
    outcomes: string[];
    // New fields for handwriting support
    unitDrawing?: string;
    lessonTitleDrawing?: string;
    unitMode?: 'text' | 'drawing';
    lessonTitleMode?: 'text' | 'drawing';
}

export interface Point {
    x: number;
    y: number;
    pressure?: number;
}

export interface Stroke {
    points: Point[];
    color: string;
    size: number;
    isEraser: boolean;
}

interface Student {
    id: string;
    name: string;
    points: number;
}

interface Group {
    id: string;
    name: string;
    points: number;
    leader?: string;
}

interface AppContextType {
    selectedSubject: Subject | null;
    setSelectedSubject: (subject: Subject | null) => void;
    students: Student[];
    addStudent: (name: string) => void;
    updateStudentPoints: (id: string, delta: number) => void;
    groups: Group[];
    updateGroupPoints: (id: string, delta: number) => void;
    updateGroupName: (id: string, name: string) => void;
    updateGroupLeader: (id: string, leader: string) => void;
    deleteGroup: (id: string) => void;

    // New State
    lessonSetup: LessonSetup;
    setLessonSetup: (setup: LessonSetup) => void;
    activeSession: boolean;
    startSession: () => void;
    endSession: () => void;
    pdfFile: File | null;
    setPdfFile: (file: File | null) => void;

    // PDF Annotation State
    annotations: Record<number, Stroke[]>;
    setAnnotations: (annotations: Record<number, Stroke[]>) => void;
    isAnnotationMode: boolean;
    setIsAnnotationMode: (isMode: boolean) => void;

    // Sound State
    isSoundEnabled: boolean;
    toggleSound: () => void;

    // Class Roster State
    classStudents: string[];
    loadClassStudents: (stage: string, grade: string, className: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETUP: LessonSetup = {
    stage: '',
    system: 'عام',
    grade: '',
    className: '',
    term: '',
    subject: '',
    unit: '',
    lessonTitle: '',
    outcomes: ['', '', ''],
    unitMode: 'text',
    lessonTitleMode: 'text',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [groups, setGroups] = useState<Group[]>([
        { id: 'g1', name: 'المجموعة الأولى', points: 0 },
        { id: 'g2', name: 'المجموعة الثانية', points: 0 },
        { id: 'g3', name: 'المجموعة الثالثة', points: 0 },
        { id: 'g4', name: 'المجموعة الرابعة', points: 0 },
        { id: 'g5', name: 'المجموعة الخامسة', points: 0 },
    ]);

    // New State
    const [lessonSetup, setLessonSetup] = useState<LessonSetup>(DEFAULT_SETUP);
    const [activeSession, setActiveSession] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [annotations, setAnnotations] = useState<Record<number, Stroke[]>>({});
    const [isAnnotationMode, setIsAnnotationMode] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [classStudents, setClassStudents] = useState<string[]>([]);

    const toggleSound = () => setIsSoundEnabled(prev => !prev);

    const loadClassStudents = (stage: string, grade: string, className: string) => {
        // Map grade string to number (e.g., "الصف الأول" -> 1)
        const gradeMap: Record<string, number> = {
            "الصف الأول": 1,
            "الصف الثاني": 2,
            "الصف الثالث": 3,
            "الصف الرابع": 4,
            "الصف الخامس": 5,
            "الصف السادس": 6,
        };

        const gradeNum = gradeMap[grade];

        // Find matching class
        const foundClass = studentsData.find(c => {
            // Check stage
            if (c.stage !== stage) return false;

            // Check grade
            if (c.grade !== gradeNum) return false;

            // Check class (handle string vs number)
            // If className is "1", "2", etc., it might match a number in JSON
            // If className is "تحفيظ 1", it matches a string in JSON
            const classNum = parseInt(className);
            if (!isNaN(classNum)) {
                return c.class === classNum;
            } else {
                return c.class === className;
            }
        });

        if (foundClass) {
            setClassStudents(foundClass.students);
        } else {
            setClassStudents([]);
        }
    };

    // Load from localStorage on mount
    useEffect(() => {
        const savedSetup = localStorage.getItem('smartboardLessonSetup');
        if (savedSetup) {
            try {
                const parsed = JSON.parse(savedSetup);
                setLessonSetup(parsed);
            } catch (e) {
                console.error('Failed to parse saved lesson setup', e);
            }
        }
    }, []);

    const startSession = () => {
        localStorage.setItem('smartboardLessonSetup', JSON.stringify(lessonSetup));
        setActiveSession(true);

        // Sync selected subject with lesson setup
        if (lessonSetup.subject && SUBJECTS.includes(lessonSetup.subject as Subject)) {
            setSelectedSubject(lessonSetup.subject as Subject);
        }
    };

    const endSession = () => {
        setActiveSession(false);
    };

    const addStudent = (name: string) => {
        const newStudent: Student = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            points: 0,
        };
        setStudents([...students, newStudent]);
    };

    const updateStudentPoints = (id: string, delta: number) => {
        setStudents(students.map(s => s.id === id ? { ...s, points: s.points + delta } : s));
    };

    const updateGroupPoints = (id: string, delta: number) => {
        setGroups(groups.map(g => g.id === id ? { ...g, points: g.points + delta } : g));
    };

    const updateGroupName = (id: string, name: string) => {
        setGroups(groups.map(g => g.id === id ? { ...g, name } : g));
    };

    const updateGroupLeader = (id: string, leader: string) => {
        setGroups(groups.map(g => g.id === id ? { ...g, leader } : g));
    };

    const deleteGroup = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
            setGroups(groups.filter(g => g.id !== id));
        }
    };

    return (
        <AppContext.Provider value={{
            selectedSubject,
            setSelectedSubject,
            students,
            addStudent,
            updateStudentPoints,
            groups,
            updateGroupPoints,
            updateGroupName,
            updateGroupLeader,
            deleteGroup,
            lessonSetup,
            setLessonSetup,
            activeSession,
            startSession,
            endSession,
            pdfFile,
            setPdfFile,
            annotations,
            setAnnotations,
            isAnnotationMode,
            setIsAnnotationMode,
            isSoundEnabled,
            toggleSound,
            classStudents,
            loadClassStudents,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
