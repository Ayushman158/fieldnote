export type InterviewMode = 'Live' | 'Transcript';

export type TagCategory = 'Behaviour' | 'Motivation' | 'Friction' | 'Impact';

export interface Tag {
    id: string;
    name: string;
    category: TagCategory;
    isCustom?: boolean;
}

export interface Project {
    id: string;
    name: string;
    description: string;
}

export interface TemplateCategory {
    id: string;
    name: string;
    enableStress: boolean;
    enableTags: boolean;
}

export interface Question {
    id: string;
    prompt: string;
    notes: string;
    stressLevel?: number; // 1-5
    tags: string[]; // array of tag ids
}

export interface InterviewSection {
    categoryId: string;
    questions: Question[];
}

export interface InterviewMetadata {
    participantId: string;
    date: string;
    city: string;
    mode: InterviewMode;
    duration: string;
}

export interface Interview {
    id: string;
    projectId: string;
    metadata: InterviewMetadata;
    sections: InterviewSection[];
}
