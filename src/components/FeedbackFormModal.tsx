import { useState } from 'react';
import { trackEvent } from '../analytics';
import { X } from 'lucide-react';

interface Props {
    onClose: () => void;
}

export default function FeedbackFormModal({ onClose }: Props) {
    // Form State
    const [researchType, setResearchType] = useState('');
    const [researchTypeOther, setResearchTypeOther] = useState('');
    const [interviewCount, setInterviewCount] = useState('');
    const [problemSolved, setProblemSolved] = useState('');
    const [valuableFeature, setValuableFeature] = useState('');
    const [confusing, setConfusing] = useState('');
    const [missing, setMissing] = useState('');
    const [useAgain, setUseAgain] = useState('');
    const [recommend, setRecommend] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        trackEvent('feedback_submitted', {
            research_type: researchType === 'Other' ? researchTypeOther : researchType,
            interview_count: interviewCount,
            problem_solved: problemSolved,
            valuable_feature: valuableFeature,
            friction_confusing: confusing,
            friction_missing: missing,
            retention_use_again: useAgain,
            retention_recommend: recommend,
        });

        // Simulate network request
        setTimeout(() => {
            setIsSubmitting(false);
            onClose();
            alert('Thank you for the valuable feedback! It really helps improve FieldNote.');
        }, 600);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200 animate-in fade-in zoom-in-95 duration-200 relative">

                <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-900">
                    <X size={20} />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-semibold mb-2">Help Improve FieldNote</h2>
                    <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                        We're learning how researchers use FieldNote. Your responses are anonymous and help directly shape the tool.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1 */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b pb-2">Section 1 — Usage Context</h3>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">What type of research are you conducting?</label>
                                <div className="space-y-2">
                                    {['UX research', 'Academic research', 'Product discovery', 'Service design', 'Personal project', 'Other'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 cursor-pointer text-sm text-gray-700">
                                            <input type="radio" name="researchType" value={opt} checked={researchType === opt} onChange={e => setResearchType(e.target.value)} className="accent-indigo-600" required />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                                {researchType === 'Other' && (
                                    <input type="text" placeholder="Please specify..." className="w-full border border-gray-300 rounded p-2 text-sm mt-2 outline-none focus:border-indigo-500" value={researchTypeOther} onChange={e => setResearchTypeOther(e.target.value)} required />
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">How many interviews have you conducted using FieldNote?</label>
                                <div className="flex flex-wrap gap-4">
                                    {['1', '2–3', '4–7', '8+'].map(opt => (
                                        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                            <input type="radio" name="intCount" value={opt} checked={interviewCount === opt} onChange={e => setInterviewCount(e.target.value)} className="accent-indigo-600" required />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 2 */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b pb-2">Section 2 — Value</h3>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">What problem does FieldNote solve for you?</label>
                                <textarea value={problemSolved} onChange={e => setProblemSolved(e.target.value)} placeholder="Open text..." className="w-full border border-gray-200 focus:border-indigo-500 rounded p-3 text-sm h-24 resize-y outline-none" required></textarea>
                            </div>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">What feature feels most valuable?</label>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                    {['Structured categories', 'Tagging system', 'Insights dashboard', 'Export summary', 'Custom structure', 'Other'].map(opt => (
                                        <label key={opt} className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="valuableFeature" value={opt} checked={valuableFeature === opt} onChange={e => setValuableFeature(e.target.value)} className="accent-indigo-600" required />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 3 */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b pb-2">Section 3 — Friction</h3>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">What felt confusing or unnecessary?</label>
                                <textarea value={confusing} onChange={e => setConfusing(e.target.value)} placeholder="Open text..." className="w-full border border-gray-200 focus:border-indigo-500 rounded p-3 text-sm h-20 resize-y outline-none" required></textarea>
                            </div>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">What is missing?</label>
                                <textarea value={missing} onChange={e => setMissing(e.target.value)} placeholder="Open text..." className="w-full border border-gray-200 focus:border-indigo-500 rounded p-3 text-sm h-20 resize-y outline-none" required></textarea>
                            </div>
                        </div>

                        {/* Section 4 */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest border-b pb-2">Section 4 — Retention</h3>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">Would you use FieldNote again?</label>
                                <div className="flex flex-wrap gap-6">
                                    {['Definitely', 'Maybe', 'Unlikely'].map(opt => (
                                        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                            <input type="radio" name="useAgain" value={opt} checked={useAgain === opt} onChange={e => setUseAgain(e.target.value)} className="accent-indigo-600" required />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block font-medium text-gray-900 text-sm">Would you recommend it?</label>
                                <div className="flex flex-wrap gap-6">
                                    {['Yes', 'No', 'Not sure'].map(opt => (
                                        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                                            <input type="radio" name="recommend" value={opt} checked={recommend === opt} onChange={e => setRecommend(e.target.value)} className="accent-indigo-600" required />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 text-white font-medium hover:bg-indigo-700 px-6 py-2.5 rounded-md transition duration-200 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
