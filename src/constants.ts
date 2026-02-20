import type { Tag, TemplateCategory } from './types';

export const PREDEFINED_TAGS: Tag[] = [
    // Behaviour
    { id: 'b_routine', name: 'routine-driven', category: 'Behaviour' },
    { id: 'b_adaptive', name: 'adaptive', category: 'Behaviour' },
    { id: 'b_proactive', name: 'proactive', category: 'Behaviour' },
    { id: 'b_reactive', name: 'reactive', category: 'Behaviour' },
    { id: 'b_workaround', name: 'workaround-heavy', category: 'Behaviour' },
    { id: 'b_comparison', name: 'comparison-oriented', category: 'Behaviour' },
    { id: 'b_habit', name: 'habit-based', category: 'Behaviour' },
    { id: 'b_tool_switch', name: 'tool-switching', category: 'Behaviour' },

    // Motivation
    { id: 'm_convenience', name: 'convenience-seeking', category: 'Motivation' },
    { id: 'm_efficiency', name: 'efficiency-focused', category: 'Motivation' },
    { id: 'm_cost', name: 'cost-sensitive', category: 'Motivation' },
    { id: 'm_quality', name: 'quality-focused', category: 'Motivation' },
    { id: 'm_risk_averse', name: 'risk-averse', category: 'Motivation' },
    { id: 'm_control', name: 'control-seeking', category: 'Motivation' },
    { id: 'm_flexibility', name: 'flexibility-valuing', category: 'Motivation' },
    { id: 'm_safety', name: 'safety-conscious', category: 'Motivation' },

    // Friction
    { id: 'f_time', name: 'time-friction', category: 'Friction' },
    { id: 'f_info', name: 'information-gap', category: 'Friction' },
    { id: 'f_coordination', name: 'coordination-friction', category: 'Friction' },
    { id: 'f_usability', name: 'usability-friction', category: 'Friction' },
    { id: 'f_access', name: 'access-barrier', category: 'Friction' },
    { id: 'f_trust', name: 'trust-friction', category: 'Friction' },
    { id: 'f_reliability', name: 'reliability-issue', category: 'Friction' },
    { id: 'f_overload', name: 'overload', category: 'Friction' },
    { id: 'f_uncertainty', name: 'uncertainty', category: 'Friction' },
    { id: 'f_inconsistency', name: 'inconsistency', category: 'Friction' },

    // Impact
    { id: 'i_mental', name: 'mental-fatigue', category: 'Impact' },
    { id: 'i_decision', name: 'decision-fatigue', category: 'Impact' },
    { id: 'i_stress', name: 'stress-elevation', category: 'Impact' },
    { id: 'i_disengage', name: 'disengagement', category: 'Impact' },
    { id: 'i_reduced', name: 'reduced-performance', category: 'Impact' },
    { id: 'i_avoidance', name: 'avoidance-behaviour', category: 'Impact' },
    { id: 'i_satisfaction', name: 'satisfaction', category: 'Impact' },
    { id: 'i_neutral', name: 'neutral-impact', category: 'Impact' },
];

export const DEFAULT_TEMPLATE_CATEGORIES: TemplateCategory[] = [
    { id: 'cat_context', name: 'Context', enableStress: false, enableTags: true },
    { id: 'cat_decisions', name: 'Decisions', enableStress: false, enableTags: true },
    { id: 'cat_stress', name: 'Stress', enableStress: true, enableTags: true },
    { id: 'cat_coping', name: 'Coping', enableStress: true, enableTags: true },
    { id: 'cat_impact', name: 'Impact', enableStress: true, enableTags: true },
];

export const AUTO_SUGGEST_MAPPING: Record<string, string[]> = {
    'slow': ['f_time'],
    'confusing': ['f_usability'],
    'hard': ['f_usability', 'f_time'],
    'error': ['f_reliability'],
    'bug': ['f_reliability'],
    'down': ['f_reliability'],
    'wait': ['f_time'],
    'expensive': ['m_cost'],
    'cheap': ['m_cost'],
    'price': ['m_cost'],
    'tired': ['i_mental'],
    'stress': ['i_stress'],
    'quit': ['i_avoidance'],
    'stop': ['i_avoidance'],
    'always': ['b_routine', 'b_habit'],
    'switch': ['b_tool_switch'],
    'compare': ['b_comparison'],
    'alternative': ['b_comparison']
};

export const LEADING_QUESTION_KEYWORDS = [
    "would you like",
    "don't you think",
    "isn't it better",
    "do you think this feature"
];
