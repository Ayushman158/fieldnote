import { useState } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import { Plus, ChevronLeft, Download, FileJson, PenLine, LayoutDashboard, Trash2, X, Search, Filter, Info, Server } from 'lucide-react';
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
        tags
    } = useInterviews();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterTagId, setFilterTagId] = useState<string | null>(null);
    const [dismissedOnboarding, setDismissedOnboarding] = useState(
        () => localStorage.getItem('fn_dismissed_onboarding') === 'true'
    );
    const [dismissedBackup, setDismissedBackup] = useState(
        () => localStorage.getItem('fn_dismissed_backup') === 'true'
    );

    const dismissOnboarding = () => {
        localStorage.setItem('fn_dismissed_onboarding', 'true');
        setDismissedOnboarding(true);
    };

    const projectInterviews = interviews.filter(i => i.projectId === activeProjectId);

    // Filter projectInterviews
    const filteredInterviews = projectInterviews.filter(inv => {
        let matchesSearch = true;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const idMatch = inv.id.toLowerCase().includes(query) || (inv.metadata.participantId?.toLowerCase().includes(query));
            let contentMatch = false;
            inv.sections.forEach(sec => sec.questions.forEach(q => {
                if (q.notes.toLowerCase().includes(query)) contentMatch = true;
                if (q.prompt.toLowerCase().includes(query)) contentMatch = true;
                q.tags.forEach(tid => {
                    const tagObj = tags.find(t => t.id === tid);
                    if (tagObj && tagObj.name.toLowerCase().includes(query)) contentMatch = true;
                });
            }));
            matchesSearch = !!(idMatch || contentMatch);
        }

        let matchesTag = true;
        if (filterTagId) {
            let hasTag = false;
            inv.sections.forEach(sec => sec.questions.forEach(q => {
                if (q.tags.includes(filterTagId)) hasTag = true;
            }));
            matchesTag = hasTag;
        }

        return matchesSearch && matchesTag;
    });

    // Tag frequency preview
    const projectTagCounts: Record<string, number> = {};
    projectInterviews.forEach(inv => {
        inv.sections.forEach(sec => sec.questions.forEach(q => {
            q.tags.forEach(tid => {
                projectTagCounts[tid] = (projectTagCounts[tid] || 0) + 1;
            });
        }));
    });
    const topTags = Object.entries(projectTagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tid]) => tags.find(t => t.id === tid))
        .filter(t => t !== undefined);

    const exportProjectJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectInterviews, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `project_${activeProject?.name || 'backup'}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        localStorage.setItem('fn_dismissed_backup', 'true');
        setDismissedBackup(true);
    };

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
            <div className="space-y-6 pb-20">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">{activeProject?.name || 'Project'} Interviews</h2>
                        {projectInterviews.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                                {projectInterviews.length} {projectInterviews.length === 1 ? 'interview' : 'interviews'} added
                                {projectInterviews.length >= 3 && " — patterns emerging"}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={createNewInterview}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        New Interview
                    </button>
                </div>

                {projectInterviews.length > 0 && projectInterviews.length < 3 && !dismissedOnboarding && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 relative animate-in fade-in slide-in-from-top-2">
                        <button onClick={dismissOnboarding} className="absolute right-3 top-3 text-indigo-300 hover:text-indigo-600 transition">
                            <X size={16} />
                        </button>
                        <div className="flex gap-3">
                            <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-indigo-900 mb-1">How to get meaningful insights:</h4>
                                <ul className="text-sm text-indigo-800 space-y-1 ml-1 list-inside list-disc">
                                    <li>Add at least 3 interviews</li>
                                    <li>Use tags consistently</li>
                                    <li>Insights improve with volume</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {projectInterviews.length >= 5 && !dismissedBackup && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Server size={16} className="text-gray-400" />
                            Consider exporting a backup of this project.
                        </div>
                        <button onClick={exportProjectJSON} className="text-indigo-600 font-medium hover:underline bg-white px-3 py-1.5 border border-gray-200 rounded text-xs">
                            Export Project (JSON)
                        </button>
                    </div>
                )}

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
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search notes, participants, tags..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:border-indigo-500 outline-none transition"
                                    />
                                </div>
                                <div className="sm:w-64 relative">
                                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <select
                                        value={filterTagId || ''}
                                        onChange={e => setFilterTagId(e.target.value || null)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md appearance-none focus:border-indigo-500 outline-none bg-white transition cursor-pointer"
                                    >
                                        <option value="">All Tags</option>
                                        {tags.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {topTags.length > 0 && (
                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Tags in Project:</span>
                                    {topTags.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setFilterTagId(t.id)}
                                            className="text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition"
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {filteredInterviews.length === 0 ? (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded border border-gray-100">
                                No interviews match your search criteria.
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredInterviews.map(inv => {
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
