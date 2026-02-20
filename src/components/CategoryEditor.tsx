import { useState } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import type { TemplateCategory } from '../types';
import { ChevronDown, ChevronRight, Activity, Plus } from 'lucide-react';
import QuestionBlock from './QuestionBlock';

interface Props {
    categoryTemplate: TemplateCategory;
}

export default function CategoryEditor({ categoryTemplate }: Props) {
    const { activeInterview, addQuestion, deleteQuestion, duplicateQuestion } = useInterviews();
    const [isExpanded, setIsExpanded] = useState(true);

    if (!activeInterview) return null;

    // Find the matching section. If none exists (template updated after interview creation), treat as empty
    const sectionData = activeInterview.sections.find(s => s.categoryId === categoryTemplate.id);
    const questions = sectionData?.questions || [];

    // Computations for badge
    let avgStress = 0;
    let totalTags = 0;
    if (questions.length > 0) {
        let sc = 0;
        let c = 0;
        questions.forEach(q => {
            if (q.stressLevel) { sc += q.stressLevel; c++; }
            totalTags += q.tags.length;
        });
        avgStress = c ? Math.round((sc / c) * 10) / 10 : 0;
    }

    return (
        <div
            className={`bg-white border transition-all duration-300 rounded-md ${isExpanded ? 'border-indigo-100 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                }`}
        >
            <div
                className="flex items-center justify-between p-5 cursor-pointer select-none bg-gray-50/50 rounded-t-md group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-md transition duration-200 ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                    <h3 className={`font-semibold text-lg transition ${isExpanded ? 'text-indigo-900' : 'text-gray-800'}`}>
                        {categoryTemplate.name}
                    </h3>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {questions.length} Qs
                    </span>
                </div>

                {/* Indicators when collapsed */}
                {!isExpanded && (
                    <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                        {categoryTemplate.enableStress && avgStress > 0 && (
                            <span className="flex items-center gap-1.5"><Activity size={14} className="text-red-400" /> Avg Stress: {avgStress}</span>
                        )}
                        {categoryTemplate.enableTags && totalTags > 0 && (
                            <span className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">{totalTags} built</span>
                        )}
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="p-2 md:p-6 space-y-6 bg-gray-50/30 rounded-b-md border-t border-indigo-50">

                    {questions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-sm mb-4">No questions added yet to this category.</p>
                            <button
                                onClick={() => addQuestion(activeInterview.id, categoryTemplate.id)}
                                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 border border-indigo-100 rounded-md hover:bg-indigo-100 hover:text-indigo-700 transition"
                            >
                                <Plus size={16} /> Add First Question
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((q, idx) => (
                                <QuestionBlock
                                    key={q.id}
                                    interviewId={activeInterview.id}
                                    categoryId={categoryTemplate.id}
                                    question={q}
                                    enableStress={categoryTemplate.enableStress}
                                    enableTags={categoryTemplate.enableTags}
                                    onDuplicate={() => duplicateQuestion(activeInterview.id, categoryTemplate.id, q.id)}
                                    onDelete={() => deleteQuestion(activeInterview.id, categoryTemplate.id, q.id)}
                                    index={idx}
                                />
                            ))}

                            <div className="pt-2 pl-2">
                                <button
                                    onClick={() => addQuestion(activeInterview.id, categoryTemplate.id)}
                                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition"
                                >
                                    <div className="bg-indigo-100 p-1 rounded"><Plus size={14} /></div>
                                    Add another question
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
