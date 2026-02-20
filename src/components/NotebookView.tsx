import { useInterviews } from '../context/InterviewsContext';
import { Plus, ChevronLeft, Download, FileJson, PenLine, LayoutDashboard, Trash2 } from 'lucide-react';
import InterviewMetadataEditor from './InterviewMetadataEditor';
import CategoryEditor from './CategoryEditor';
import { trackEvent } from '../analytics';

export default function NotebookView() {
    const {
        interviews,
        activeInterview,
        setActiveInterviewId,
        createNewInterview,
        deleteInterview,
        activeProjectId,
        activeProject,
        templateCategories,
    } = useInterviews();

    const projectInterviews = interviews.filter(i => i.projectId === activeProjectId);

    // Export functions
    const exportJSON = () => {
        if (!activeInterview) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeInterview, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `interview_${activeInterview.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        trackEvent('export_summary', { format: 'json' });
    };

    const exportSummary = () => {
        if (!activeInterview) return;
        const m = activeInterview.metadata;
        const s = activeInterview.sections;

        // gather tags
        const tagsByCategory: Record<string, Set<string>> = {
            'Behaviour': new Set(),
            'Stress': new Set(),
            'Impact': new Set()
        };

        let keyQuotesBlock = '';
        let categorySummaries = '';

        templateCategories.forEach(catDef => {
            const sec = s.find(sec => sec.categoryId === catDef.id);
            if (!sec || sec.questions.length === 0) return;

            categorySummaries += `\n[${catDef.name.toUpperCase()}]\n`;
            sec.questions.forEach((q, idx) => {
                q.tags.forEach(tagId => {
                    if (tagId.startsWith('b_')) tagsByCategory['Behaviour'].add(tagId);
                    else if (tagId.startsWith('s_')) tagsByCategory['Stress'].add(tagId);
                    else if (tagId.startsWith('i_')) tagsByCategory['Impact'].add(tagId);
                });

                categorySummaries += `Q${idx + 1}: ${q.prompt}\nNotes: ${q.notes}\n`;

                // Detect simple quotes
                const quotes = q.notes.match(/"([^"]+)"/g);
                if (quotes) {
                    quotes.forEach(quote => keyQuotesBlock += `- ${quote}\n`);
                }
            });
        });

        const formatTags = (cat: string) => Array.from(tagsByCategory[cat] || []).map(t => '- ' + t.replace(/^[bsic]_/, '')).join('\n');

        const summary = `Participant ID: ${m.participantId}
City: ${m.city || '-'}
Mode: ${m.mode}

Behaviour Patterns
${formatTags('Behaviour') || '- None'}

Stress Themes
${formatTags('Stress') || '- None'}

Impact Themes
${formatTags('Impact') || '- None'}

Key Quotes
${keyQuotesBlock || '- None detected'}

Detailed Interview Notes
${categorySummaries}
`;

        const blob = new Blob([summary], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", `summary_${activeInterview.id}.txt`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        trackEvent('export_summary', { format: 'text' });
    };

    if (!activeInterview) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold tracking-tight">{activeProject?.name || 'Project'} Interviews</h2>
                    <button
                        onClick={createNewInterview}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        New Interview
                    </button>
                </div>

                {projectInterviews.length === 0 ? (
                    <div className="max-w-xl mx-auto mt-12 py-12 px-8 bg-white rounded-md border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-50 text-indigo-600 rounded-md flex items-center justify-center mx-auto mb-6">
                            <PenLine size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Structure your qualitative research.</h3>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            Capture structured interview notes and identify emerging patterns.
                        </p>
                        <button
                            onClick={createNewInterview}
                            className="bg-indigo-600 text-white font-medium flex items-center gap-2 justify-center mx-auto py-2.5 px-6 rounded-md hover:bg-indigo-700 transition duration-200"
                        >   <Plus size={18} />
                            Start Interview
                        </button>

                        <div className="grid grid-cols-2 gap-4 text-left mt-12 pt-8 border-t border-gray-100">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-indigo-700 font-semibold"><LayoutDashboard size={16} className="rotate-180" /> Customize</div>
                                <p className="text-[13px] text-gray-500 leading-relaxed">Edit your research questions globally via the Structure button in the navigation bar.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-indigo-700 font-semibold"><LayoutDashboard size={16} /> View Insights</div>
                                <p className="text-[13px] text-gray-500 leading-relaxed">As you record notes and tags, this view generates patterns automatically.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {projectInterviews.map(inv => {
                            let stressSum = 0;
                            let stressCount = 0;
                            let tagCount = 0;
                            inv.sections.forEach(sec => sec.questions.forEach(q => {
                                if (q.stressLevel) { stressSum += q.stressLevel; stressCount++; }
                                tagCount += q.tags.length;
                            }));
                            const avgStress = stressCount ? (stressSum / stressCount).toFixed(1) : '-';

                            return (
                                <div
                                    key={inv.id}
                                    onClick={() => setActiveInterviewId(inv.id)}
                                    className="bg-white p-5 rounded-md border border-gray-200 hover:border-indigo-600 cursor-pointer transition flex justify-between items-center group relative"
                                >
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-900 transition tracking-tight">
                                            {inv.metadata.participantId || 'Unknown Participant'}
                                        </h3>
                                        <div className="text-sm font-medium text-gray-400 flex items-center gap-3 mt-1 tracking-wide">
                                            <span>{inv.metadata.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span>{inv.metadata.mode}</span>
                                            {inv.metadata.city && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span>{inv.metadata.city}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex gap-4 text-xs font-semibold text-gray-500">
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-400 uppercase tracking-widest text-[9px] mb-0.5">Friction</span>
                                                <span className={`${avgStress !== '-' && parseFloat(avgStress) > 3 ? 'text-orange-500' : 'text-gray-900'} text-sm`}>{avgStress}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-400 uppercase tracking-widest text-[9px] mb-0.5">Tags</span>
                                                <span className="text-gray-900 text-sm">{tagCount}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this interview?')) deleteInterview(inv.id)
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition ml-2"
                                            title="Delete Interview"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-32 animate-in fade-in duration-300">
            <div className="flex items-center justify-between sticky top-[4.5rem] bg-gray-50/90 py-2 z-10 backdrop-blur">
                <button
                    onClick={() => setActiveInterviewId(null)}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-900 font-medium transition-colors -ml-2 px-2 py-1 rounded"
                >
                    <ChevronLeft size={20} />
                    Back
                </button>

                <div className="flex gap-1 bg-white p-1 rounded-md border border-gray-200">
                    <button onClick={exportSummary} title="Export Text Summary" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition flex items-center gap-2 text-sm font-medium pr-3">
                        <Download size={16} /> <span className="hidden sm:inline">Export</span>
                    </button>
                    <button onClick={exportJSON} title="Export JSON" className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition flex items-center gap-2 text-sm font-medium pr-3">
                        <FileJson size={16} /> <span className="hidden sm:inline">JSON</span>
                    </button>
                    <div className="w-px bg-gray-200 mx-1"></div>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this interview?')) deleteInterview(activeInterview.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Delete Interview"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <InterviewMetadataEditor />

            <div className="space-y-8 mt-12">
                {templateCategories.map((category) => (
                    <CategoryEditor key={category.id} categoryTemplate={category} />
                ))}
            </div>

        </div>
    );
}
