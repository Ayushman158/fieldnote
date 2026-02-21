import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Interview, TemplateCategory, Tag, Question, InterviewSection, Project } from '../types';
import { PREDEFINED_TAGS, DEFAULT_TEMPLATE_CATEGORIES } from '../constants';
import { trackEvent } from '../analytics';

interface InterviewsContextType {
    onboardingCompleted: boolean;
    setOnboardingCompleted: (val: boolean) => void;
    templateCategories: TemplateCategory[];
    setTemplateCategories: (categories: TemplateCategory[]) => void;
    updateTemplateCategory: (id: string, updates: Partial<TemplateCategory>) => void;
    applyTemplateToAllInterviews: (templates: TemplateCategory[]) => void;

    projects: Project[];
    activeProjectId: string | null;
    activeProject: Project | undefined;
    setActiveProjectId: (id: string | null) => void;
    addProject: (name: string, description?: string) => Project;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    interviews: Interview[];
    activeInterviewId: string | null;
    activeInterview: Interview | undefined;
    tags: Tag[]; // Includes custom tags

    setActiveInterviewId: (id: string | null) => void;
    createNewInterview: () => void;
    updateInterviewMetadata: (id: string, updates: Partial<Interview['metadata']>) => void;
    deleteInterview: (id: string) => void;
    addCustomTag: (name: string, category: Tag['category']) => Tag;

    // AI Features
    geminiApiKey: string | null;
    setGeminiApiKey: (key: string | null) => void;

    // Question level updates
    addQuestion: (interviewId: string, categoryId: string) => void;
    updateQuestion: (interviewId: string, categoryId: string, questionId: string, updates: Partial<Question>) => void;
    deleteQuestion: (interviewId: string, categoryId: string, questionId: string) => void;
    duplicateQuestion: (interviewId: string, categoryId: string, questionId: string) => void;
}

const InterviewsContext = createContext<InterviewsContextType | undefined>(undefined);

const PROJECTS_KEY = 'fieldnote_projects_v3';
const LOCAL_STORAGE_KEY = 'fieldnote_interviews_v3';
const TAGS_STORAGE_KEY = 'fieldnote_custom_tags_v3';
const TEMPLATE_KEY = 'fieldnote_templates_v3';
const ONBOARDING_KEY = 'fieldnote_onboarding_v3';

export function InterviewsProvider({ children }: { children: ReactNode }) {
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(() => {
        return localStorage.getItem(ONBOARDING_KEY) === 'true';
    });

    const [templateCategories, setTemplateCategories] = useState<TemplateCategory[]>(() => {
        const saved = localStorage.getItem(TEMPLATE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE_CATEGORIES;
    });

    const [projects, setProjects] = useState<Project[]>(() => {
        const saved = localStorage.getItem(PROJECTS_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [interviews, setInterviews] = useState<Interview[]>(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [customTags, setCustomTags] = useState<Tag[]>(() => {
        const saved = localStorage.getItem(TAGS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const [geminiApiKey, setGeminiApiKey] = useState<string | null>(() => {
        return localStorage.getItem('fieldnote_gemini_key') || null;
    });

    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [activeInterviewId, setActiveInterviewId] = useState<string | null>(null);

    useEffect(() => { localStorage.setItem(ONBOARDING_KEY, onboardingCompleted ? 'true' : 'false'); }, [onboardingCompleted]);
    useEffect(() => { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templateCategories)); }, [templateCategories]);
    useEffect(() => { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); }, [projects]);
    useEffect(() => { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(interviews)); }, [interviews]);
    useEffect(() => { localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(customTags)); }, [customTags]);
    useEffect(() => {
        if (geminiApiKey) localStorage.setItem('fieldnote_gemini_key', geminiApiKey);
        else localStorage.removeItem('fieldnote_gemini_key');
    }, [geminiApiKey]);

    const tags = [...PREDEFINED_TAGS, ...customTags];

    const addProject = useCallback((name: string, description: string = '') => {
        const newProject: Project = {
            id: `proj_${Date.now()}`,
            name,
            description
        };
        setProjects(prev => {
            if (prev.length === 0) trackEvent('activation_completed');
            return [newProject, ...prev];
        });
        trackEvent('project_created', { project_id: newProject.id });
        return newProject;
    }, []);

    const updateProject = useCallback((id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }, []);

    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        setInterviews(prev => prev.filter(inv => inv.projectId !== id));
        if (activeProjectId === id) setActiveProjectId(null);
    }, [activeProjectId]);

    const updateTemplateCategory = useCallback((id: string, updates: Partial<TemplateCategory>) => {
        setTemplateCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
    }, []);

    const applyTemplateToAllInterviews = useCallback((templates: TemplateCategory[]) => {
        setTemplateCategories(templates);
        setInterviews(prev => prev.map(inv => {
            if (activeProjectId && inv.projectId !== activeProjectId) return inv;
            const newSections = templates.map(cat => {
                const existingSec = inv.sections.find(sec => sec.categoryId === cat.id);
                if (existingSec) return existingSec;
                return {
                    categoryId: cat.id,
                    questions: []
                };
            });
            return { ...inv, sections: newSections };
        }));
    }, [activeProjectId]);

    const createNewInterview = useCallback(() => {
        if (!activeProjectId) return;
        const newId = `int_${Date.now()}`;

        const sections: InterviewSection[] = templateCategories.map(cat => ({
            categoryId: cat.id,
            questions: [{
                id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                prompt: '',
                notes: '',
                stressLevel: cat.enableStress ? 3 : undefined,
                tags: []
            }]
        }));

        const projectInterviews = interviews.filter(i => i.projectId === activeProjectId);

        const newInterview: Interview = {
            id: newId,
            projectId: activeProjectId,
            metadata: {
                participantId: `P${projectInterviews.length + 1}`,
                date: new Date().toISOString().split('T')[0],
                city: '',
                mode: 'Live',
                duration: ''
            },
            sections
        };

        setInterviews(prev => [newInterview, ...prev]);
        setActiveInterviewId(newId);
        trackEvent('interview_created', { project_id: activeProjectId });
    }, [interviews, templateCategories, activeProjectId]);

    const updateInterviewMetadata = useCallback((id: string, updates: Partial<Interview['metadata']>) => {
        setInterviews(prev => prev.map(inv =>
            inv.id === id ? { ...inv, metadata: { ...inv.metadata, ...updates } } : inv
        ));
    }, []);

    const deleteInterview = useCallback((id: string) => {
        setInterviews(prev => prev.filter(inv => inv.id !== id));
        if (activeInterviewId === id) setActiveInterviewId(null);
        trackEvent('interview_deleted');
    }, [activeInterviewId]);

    const addCustomTag = useCallback((name: string, category: Tag['category']) => {
        const newTag: Tag = {
            id: `c_${Date.now()}`,
            name: name.toLowerCase().replace(/\s+/g, '-'),
            category,
            isCustom: true
        };
        setCustomTags(prev => [...prev, newTag]);
        trackEvent('tag_added', { custom: true, tag_category: category });
        return newTag;
    }, []);

    // Question mutators
    const addQuestion = useCallback((interviewId: string, categoryId: string) => {
        setInterviews(prev => prev.map(inv => {
            if (inv.id !== interviewId) return inv;
            const catTemplate = templateCategories.find(c => c.id === categoryId);
            const newSections = inv.sections.map(sec => {
                if (sec.categoryId !== categoryId) return sec;
                return {
                    ...sec,
                    questions: [
                        ...sec.questions,
                        {
                            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                            prompt: '',
                            notes: '',
                            stressLevel: catTemplate?.enableStress ? 3 : undefined,
                            tags: []
                        }
                    ]
                };
            });
            return { ...inv, sections: newSections };
        }));
    }, [templateCategories]);

    const updateQuestion = useCallback((interviewId: string, categoryId: string, questionId: string, updates: Partial<Question>) => {
        setInterviews(prev => prev.map(inv => {
            if (inv.id !== interviewId) return inv;
            const newSections = inv.sections.map(sec => {
                if (sec.categoryId !== categoryId) return sec;
                return {
                    ...sec,
                    questions: sec.questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
                };
            });
            return { ...inv, sections: newSections };
        }));
    }, []);

    const deleteQuestion = useCallback((interviewId: string, categoryId: string, questionId: string) => {
        setInterviews(prev => prev.map(inv => {
            if (inv.id !== interviewId) return inv;
            const newSections = inv.sections.map(sec => {
                if (sec.categoryId !== categoryId) return sec;
                return {
                    ...sec,
                    questions: sec.questions.filter(q => q.id !== questionId)
                };
            });
            return { ...inv, sections: newSections };
        }));
    }, []);

    const duplicateQuestion = useCallback((interviewId: string, categoryId: string, questionId: string) => {
        setInterviews(prev => prev.map(inv => {
            if (inv.id !== interviewId) return inv;
            const newSections = inv.sections.map(sec => {
                if (sec.categoryId !== categoryId) return sec;
                const qIndex = sec.questions.findIndex(q => q.id === questionId);
                if (qIndex === -1) return sec;

                const qToDup = sec.questions[qIndex];
                const newQ = {
                    ...qToDup,
                    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                };

                const newQuestions = [...sec.questions];
                newQuestions.splice(qIndex + 1, 0, newQ);

                return { ...sec, questions: newQuestions };
            });
            return { ...inv, sections: newSections };
        }));
    }, []);

    const activeInterview = interviews.find(i => i.id === activeInterviewId);
    const activeProject = projects.find(p => p.id === activeProjectId);

    return (
        <InterviewsContext.Provider value={{
            onboardingCompleted, setOnboardingCompleted,
            templateCategories, setTemplateCategories, updateTemplateCategory, applyTemplateToAllInterviews,
            projects, activeProjectId, activeProject, setActiveProjectId, addProject, updateProject, deleteProject,
            interviews, activeInterviewId, activeInterview, tags,
            setActiveInterviewId, createNewInterview, updateInterviewMetadata,
            deleteInterview, addCustomTag,
            addQuestion, updateQuestion, deleteQuestion, duplicateQuestion,
            geminiApiKey, setGeminiApiKey
        }}>
            {children}
        </InterviewsContext.Provider>
    );
}

export function useInterviews() {
    const context = useContext(InterviewsContext);
    if (context === undefined) {
        throw new Error('useInterviews must be used within an InterviewsProvider');
    }
    return context;
}
