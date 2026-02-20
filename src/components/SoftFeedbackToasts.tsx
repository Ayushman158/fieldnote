import { useState, useEffect } from 'react';
import { trackEvent } from '../analytics';
import { useInterviews } from '../context/InterviewsContext';
import { X, Send, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function SoftFeedbackToasts() {
    const { interviews, activeProjectId, updateProject } = useInterviews();

    const [showResearchGoal, setShowResearchGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');

    const [showExportPoll, setShowExportPoll] = useState(false);
    const [showExportTextarea, setShowExportTextarea] = useState(false);
    const [exportFriction, setExportFriction] = useState('');

    const [showMicroPoll, setShowMicroPoll] = useState(false);

    useEffect(() => {
        // Trigger 1: 3 interviews OR Insights viewed twice
        if (interviews.length >= 3 && !localStorage.getItem('sf_research_goal_done')) {
            setShowResearchGoal(true);
        }

        const handleInsights = () => {
            const count = parseInt(localStorage.getItem('sf_insights_count') || '0') + 1;
            localStorage.setItem('sf_insights_count', count.toString());
            if (count >= 2 && !localStorage.getItem('sf_research_goal_done')) {
                setShowResearchGoal(true);
            }
        };

        const handleExport = () => {
            if (!localStorage.getItem('sf_export_poll_done')) {
                setShowExportPoll(true);
            }
        };

        // 7 days usage micro poll
        const firstUse = localStorage.getItem('sf_first_use') || Date.now().toString();
        if (!localStorage.getItem('sf_first_use')) localStorage.setItem('sf_first_use', firstUse);
        if (Date.now() - parseInt(firstUse) > 7 * 24 * 60 * 60 * 1000 && !localStorage.getItem('sf_micropoll_done')) {
            setShowMicroPoll(true);
        }

        window.addEventListener('fieldnote_insights_viewed', handleInsights);
        window.addEventListener('fieldnote_export_done', handleExport);
        return () => {
            window.removeEventListener('fieldnote_insights_viewed', handleInsights);
            window.removeEventListener('fieldnote_export_done', handleExport);
        };
    }, [interviews.length]);

    // Handlers
    const submitResearchGoal = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!goalInput.trim()) return;
        trackEvent('soft_feedback', { type: 'research_goal', content: goalInput });

        if (activeProjectId && updateProject) {
            updateProject(activeProjectId, { description: goalInput.trim() });
        }

        localStorage.setItem('sf_research_goal_done', 'true');
        setShowResearchGoal(false);
    };

    const submitExportPoll = (helpful: boolean) => {
        trackEvent('soft_feedback', { type: 'export_helpful', content: helpful ? 'yes' : 'no' });
        if (helpful) {
            localStorage.setItem('sf_export_poll_done', 'true');
            setShowExportPoll(false);
        } else {
            setShowExportTextarea(true);
        }
    };

    const submitExportFriction = () => {
        trackEvent('soft_feedback', { type: 'export_friction', content: exportFriction });
        localStorage.setItem('sf_export_poll_done', 'true');
        setShowExportPoll(false);
    };

    const submitMicroPoll = (goal: string) => {
        trackEvent('soft_feedback', { type: 'micropoll_goal', content: goal });
        localStorage.setItem('sf_micropoll_done', 'true');
        setShowMicroPoll(false);
    };

    const closeHandler = (key: string, setter: (v: boolean) => void) => {
        localStorage.setItem(key, 'true');
        setter(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full font-sans">
            {/* Research Goal Banner */}
            {showResearchGoal && (
                <div className="bg-white border border-gray-200 shadow-lg rounded-md p-5 animate-in slide-in-from-bottom-5 duration-300 relative">
                    <button onClick={() => closeHandler('sf_research_goal_done', setShowResearchGoal)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-900"><X size={14} /></button>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 pr-6 tracking-tight">You've conducted multiple interviews.</h4>
                    <p className="text-gray-500 text-xs mb-4">What are you researching? (Optional)</p>
                    <form onSubmit={submitResearchGoal} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="E.g. Commuter stress in Delhi..."
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            className="flex-1 text-sm border border-gray-300 rounded p-2 outline-none focus:border-indigo-500 transition"
                        />
                        <button type="submit" disabled={!goalInput.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded p-2 transition">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Export helpful Poll */}
            {showExportPoll && (
                <div className="bg-white border border-gray-200 shadow-lg rounded-md p-5 animate-in slide-in-from-bottom-5 duration-300 relative">
                    <button onClick={() => closeHandler('sf_export_poll_done', setShowExportPoll)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-900"><X size={14} /></button>
                    <h4 className="font-semibold text-gray-900 text-sm mb-4 pr-6 tracking-tight">Was this export format helpful?</h4>

                    {!showExportTextarea ? (
                        <div className="flex gap-3">
                            <button onClick={() => submitExportPoll(true)} className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-2 rounded transition">
                                <ThumbsUp size={14} /> Yes
                            </button>
                            <button onClick={() => submitExportPoll(false)} className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 p-2 rounded transition">
                                <ThumbsDown size={14} /> Not really
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                            <textarea
                                value={exportFriction}
                                onChange={e => setExportFriction(e.target.value)}
                                placeholder="What would make it better?"
                                className="w-full text-sm border border-gray-300 rounded p-2 outline-none focus:border-indigo-500 transition min-h-16 resize-y"
                                autoFocus
                            />
                            <button onClick={submitExportFriction} disabled={!exportFriction.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded p-2 transition">
                                Send Feedback
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 7 days micropoll */}
            {showMicroPoll && (
                <div className="bg-white border border-gray-200 shadow-lg rounded-md p-5 animate-in slide-in-from-bottom-5 duration-300 relative">
                    <button onClick={() => closeHandler('sf_micropoll_done', setShowMicroPoll)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-900"><X size={14} /></button>
                    <h4 className="font-semibold text-gray-900 text-sm mb-4 pr-6 tracking-tight">What's your primary goal with FieldNote?</h4>
                    <div className="flex flex-col gap-2">
                        {['Organizing notes', 'Identifying patterns', 'Teaching research', 'Other'].map(opt => (
                            <button key={opt} onClick={() => submitMicroPoll(opt)} className="text-left text-xs font-medium text-gray-700 border border-gray-200 hover:border-indigo-400 hover:text-indigo-700 bg-gray-50 hover:bg-indigo-50 p-2 rounded transition">
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
