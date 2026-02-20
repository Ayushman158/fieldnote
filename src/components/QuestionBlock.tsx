import { useState, useEffect } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import type { Question } from '../types';
import { AUTO_SUGGEST_MAPPING, LEADING_QUESTION_KEYWORDS } from '../constants';
import { AlertTriangle, Activity, Trash2, Copy } from 'lucide-react';
import TagSelector from './TagSelector';

interface Props {
    interviewId: string;
    categoryId: string;
    question: Question;
    enableStress: boolean;
    enableTags: boolean;
    onDuplicate: () => void;
    onDelete: () => void;
    index: number;
}

export default function QuestionBlock({
    interviewId, categoryId, question, enableStress, enableTags, onDuplicate, onDelete, index
}: Props) {
    const { updateQuestion, tags: allTags } = useInterviews();
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

    const isBiased = LEADING_QUESTION_KEYWORDS.some(keyword =>
        question.prompt.toLowerCase().includes(keyword)
    );

    useEffect(() => {
        if (!enableTags) return;
        const textToAnalyze = question.notes.toLowerCase();
        const suggestions = new Set<string>();

        Object.entries(AUTO_SUGGEST_MAPPING).forEach(([keyword, tagIds]) => {
            if (textToAnalyze.split(/\W+/).includes(keyword)) {
                tagIds.forEach(id => {
                    if (!question.tags.includes(id)) {
                        suggestions.add(id);
                    }
                });
            }
        });

        setSuggestedTags(Array.from(suggestions));
    }, [question.notes, question.tags, enableTags]);

    const getStressColor = (level: number) => {
        if (level <= 2) return {
            bg: 'bg-indigo-50/20', border: 'border-indigo-50', text: 'text-indigo-400', textMute: 'text-indigo-300', rangeBg: 'bg-indigo-100', accent: 'accent-indigo-400'
        };
        if (level === 3) return {
            bg: 'bg-indigo-50/40', border: 'border-indigo-100', text: 'text-indigo-600', textMute: 'text-indigo-400', rangeBg: 'bg-indigo-200', accent: 'accent-indigo-500'
        };
        return {
            bg: 'bg-indigo-50/80', border: 'border-indigo-200', text: 'text-indigo-800', textMute: 'text-indigo-500', rangeBg: 'bg-indigo-300', accent: 'accent-indigo-600'
        };
    };

    const stressColor = getStressColor(question.stressLevel || 3);

    const toggleTag = (tagId: string) => {
        const currentTags = question.tags || [];
        const newTags = currentTags.includes(tagId)
            ? currentTags.filter(t => t !== tagId)
            : [...currentTags, tagId];
        updateQuestion(interviewId, categoryId, question.id, { tags: newTags });
    };

    const handleSuggestClick = (tagId: string) => {
        toggleTag(tagId);
        setSuggestedTags(prev => prev.filter(t => t !== tagId));
    };

    return (
        <div className="p-5 border-l-2 border-transparent focus-within:border-indigo-500 hover:border-gray-200 transition bg-white/50 hover:bg-white rounded-md group relative space-y-4">

            {/* Question actions top right */}
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                    onClick={onDuplicate}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Duplicate"
                >
                    <Copy size={16} />
                </button>
                <button
                    onClick={onDelete}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Q{index + 1} Prompt</label>
                <div className="relative pr-16">
                    <textarea
                        placeholder="What is your question?"
                        value={question.prompt}
                        onChange={e => updateQuestion(interviewId, categoryId, question.id, { prompt: e.target.value })}
                        className="w-full text-base font-medium p-3 bg-gray-50 focus:bg-white rounded-md outline-none focus:ring-2 ring-indigo-100 border border-transparent focus:border-indigo-300 transition resize-y min-h-[50px]"
                        rows={1}
                    />
                    {isBiased && (
                        <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 px-3 rounded-md text-sm">
                            <AlertTriangle size={16} />
                            <span>Possible leading question. Consider rephrasing neutrally.</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pl-1">Notes</label>
                <textarea
                    placeholder="Observations, answers..."
                    value={question.notes}
                    onChange={e => updateQuestion(interviewId, categoryId, question.id, { notes: e.target.value })}
                    className="w-full h-24 p-4 bg-gray-50 focus:bg-white rounded-md outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent focus:border-indigo-300 transition resize-y font-mono text-sm leading-relaxed"
                />
            </div>

            {(enableStress || enableTags) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">

                    {enableStress && (
                        <div className={`space-y-3 p-3 rounded-md border transition-colors ${stressColor.bg} ${stressColor.border}`}>
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-semibold text-gray-500 uppercase flex items-center gap-1"><Activity size={12} /> Stress Level</label>
                                <span className={`text-xs font-bold bg-white border border-gray-100 px-2 rounded-full shadow-sm transition-colors ${stressColor.text}`}>{question.stressLevel || 3}/5</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-medium tracking-tight transition-colors ${stressColor.textMute}`}>Low</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={question.stressLevel || 3}
                                    onChange={e => updateQuestion(interviewId, categoryId, question.id, { stressLevel: parseInt(e.target.value) })}
                                    className={`w-full h-2 rounded-md appearance-none cursor-pointer transition-colors ${stressColor.rangeBg} ${stressColor.accent}`}
                                />
                                <span className={`text-xs font-medium tracking-tight transition-colors ${stressColor.textMute}`}>High</span>
                            </div>
                        </div>
                    )}

                    {enableTags && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase">Tags</label>
                            <TagSelector
                                selectedTags={question.tags || []}
                                onToggleTag={toggleTag}
                            />

                            {suggestedTags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                    <span className="text-[10px] uppercase font-bold text-indigo-400 mr-1 animate-pulse tracking-wide">Suggestions:</span>
                                    {suggestedTags.map(id => {
                                        const tagDef = allTags.find(t => t.id === id);
                                        if (!tagDef) return null;
                                        return (
                                            <button
                                                key={'sugg_' + id}
                                                onClick={() => handleSuggestClick(id)}
                                                className="text-xs px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition shadow-sm"
                                            >
                                                + {tagDef.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
