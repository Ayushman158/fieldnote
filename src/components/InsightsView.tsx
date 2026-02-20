import { useInterviews } from '../context/InterviewsContext';
import { BarChart3, Users, HeartPulse, Target, AlertCircle, Lightbulb } from 'lucide-react';

export default function InsightsView() {
    const { interviews, tags, templateCategories, activeProjectId } = useInterviews();
    const projectInterviews = interviews.filter(i => i.projectId === activeProjectId);

    if (projectInterviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center bg-white rounded-md border border-gray-200">
                <div className="w-16 h-16 bg-gray-50 text-indigo-600 rounded-md flex items-center justify-center mb-6 border border-gray-200">
                    <BarChart3 size={32} />
                </div>
                <h2 className="text-2xl font-semibold mb-2 tracking-tight">No data yet</h2>
                <p className="text-gray-500 max-w-sm">
                    Start capturing interviews in the Notebook view to see aggregated insights here.
                </p>
            </div>
        );
    }

    // Analytics Computation
    const totalInterviews = projectInterviews.length;

    let totalStressSum = 0;
    let totalStressCount = 0;

    const stageStressStr: Record<string, number> = {};
    const stageStressCnt: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    templateCategories.forEach(cat => {
        stageStressStr[cat.name] = 0;
        stageStressCnt[cat.name] = 0;
    });

    projectInterviews.forEach(inv => {
        inv.sections.forEach(sec => {
            const catDef = templateCategories.find(c => c.id === sec.categoryId);
            if (!catDef) return;

            sec.questions.forEach(q => {
                if (q.stressLevel) {
                    totalStressSum += q.stressLevel;
                    totalStressCount++;
                    stageStressStr[catDef.name] += q.stressLevel;
                    stageStressCnt[catDef.name]++;
                }
                q.tags.forEach(tId => tagCounts[tId] = (tagCounts[tId] || 0) + 1);
            });
        });
    });

    const overallAvgStress = totalStressCount ? (totalStressSum / totalStressCount).toFixed(1) : 0;

    let mostFreqStage = '-';
    let highestStageStress = 0;

    // Compute stage averages only for stages that track stress
    const stageAverages = templateCategories
        .filter(cat => cat.enableStress)
        .map(cat => {
            const avg = stageStressCnt[cat.name] ? (stageStressStr[cat.name] / stageStressCnt[cat.name]) : 0;
            if (avg > highestStageStress) {
                highestStageStress = avg;
                mostFreqStage = cat.name;
            }
            return { name: cat.name, avg: avg.toFixed(1) };
        });

    // Most common tags by category
    let topBehaviorId = '';
    let topBehaviorCount = 0;
    let topFrictionId = '';
    let topFrictionCount = 0;

    Object.entries(tagCounts).forEach(([tagId, count]) => {
        const tagDef = tags.find(t => t.id === tagId);
        if (!tagDef) return;

        if (tagDef.category === 'Behaviour' && count > topBehaviorCount) {
            topBehaviorCount = count;
            topBehaviorId = tagId;
        }
        if (tagDef.category === 'Friction' && count > topFrictionCount) {
            topFrictionCount = count;
            topFrictionId = tagId;
        }
    });

    const topBehaviorName = topBehaviorId ? tags.find(t => t.id === topBehaviorId)?.name : '-';
    const topFrictionName = topFrictionId ? tags.find(t => t.id === topFrictionId)?.name : '-';

    const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([id, count]) => {
            const tag = tags.find(t => t.id === id);
            return {
                id,
                name: tag?.name || id,
                category: tag?.category || 'Unknown',
                count,
                percent: ((count / totalInterviews) * 100).toFixed(0)
            };
        });

    // Segment Detection Logic (Rule-based generic)
    let efficiencySeekers = 0;
    let highFrictionUsers = 0;
    let workaroundExperts = 0;

    projectInterviews.forEach(inv => {
        const invTagIds = new Set<string>();
        let invStressSum = 0;
        let invStCnt = 0;

        inv.sections.forEach(sec => {
            sec.questions.forEach(q => {
                q.tags.forEach(t => invTagIds.add(t));
                if (q.stressLevel) {
                    invStressSum += q.stressLevel;
                    invStCnt++;
                }
            });
        });

        const avg = invStCnt ? invStressSum / invStCnt : 3;

        // Generic Rules
        if (invTagIds.has('m_efficiency') && (invTagIds.has('b_routine') || invTagIds.has('b_habit'))) efficiencySeekers++;
        if ((invTagIds.has('f_time') || invTagIds.has('f_usability')) && avg > 3) highFrictionUsers++;
        if (invTagIds.has('b_workaround') && invTagIds.has('m_control')) workaroundExperts++;
    });


    return (
        <div className="space-y-8 animate-in fade-in duration-300">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Total Interviews" value={totalInterviews} icon={<Users size={18} className="text-indigo-500" />} />
                <StatCard title="Average Stress" value={`${overallAvgStress}/5`} icon={<HeartPulse size={18} className="text-red-500" />} />
                <StatCard title="Top Behaviour" value={topBehaviorName || '-'} icon={<Target size={18} className="text-emerald-500" />} />
                <StatCard
                    title="Top Friction"
                    value={topFrictionName || '-'}
                    icon={<AlertCircle size={18} className="text-orange-500" />}
                    subtitle={mostFreqStage !== '-' ? `Highest in ${mostFreqStage}` : undefined}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-md border border-gray-200 flex flex-col">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2 tracking-tight">
                        <Lightbulb size={20} className="text-amber-500" />
                        Detected Segments
                    </h3>

                    <div className="space-y-4 flex-1">
                        <SegmentCard
                            name="Efficiency Seekers"
                            desc="Efficiency focused + Routine driven"
                            matchCount={efficiencySeekers}
                            total={totalInterviews}
                        />
                        <SegmentCard
                            name="High-Friction Users"
                            desc="Usability/Time friction + High stress"
                            matchCount={highFrictionUsers}
                            total={totalInterviews}
                        />
                        <SegmentCard
                            name="Workaround Experts"
                            desc="Workaround heavy + Control seeking"
                            matchCount={workaroundExperts}
                            total={totalInterviews}
                        />
                        {efficiencySeekers === 0 && highFrictionUsers === 0 && workaroundExperts === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 px-8 py-12 bg-gray-50/50 rounded-md border border-dashed border-gray-200">
                                <p className="text-sm">Not enough overlapping patterns detected yet. Build more generic tags to uncover recurring segments.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-md border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-6 tracking-tight">Category Stress Overview</h3>
                    <div className="space-y-3">
                        {stageAverages.length > 0 ? stageAverages.map(stage => (
                            <div key={stage.name} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition px-2 -mx-2 rounded">
                                <span className="text-gray-600 font-medium text-sm w-1/3 truncate" title={stage.name}>{stage.name}</span>
                                <div className="flex items-center justify-end gap-4 w-2/3">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0 max-w-40">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${parseFloat(stage.avg) > 3.5 ? 'bg-red-400'
                                                : parseFloat(stage.avg) > 2.5 ? 'bg-amber-400'
                                                    : 'bg-emerald-400'
                                                }`}
                                            style={{ width: `${(parseFloat(stage.avg) / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-bold w-6 text-right ${parseFloat(stage.avg) > 0 ? "text-gray-900" : "text-gray-300"}`}>{stage.avg}</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 italic">No categories are currently tracking stress.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-md border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-6 tracking-tight">Tag Frequency Dashboard</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="text-gray-400 uppercase tracking-widest text-[10px] border-b border-gray-100">
                                <th className="pb-3 px-2 font-medium">Tag</th>
                                <th className="pb-3 px-2 font-medium">Category</th>
                                <th className="pb-3 px-2 font-medium text-right">Count</th>
                                <th className="pb-3 px-2 font-medium text-right">% of Interviews</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTags.map(tag => (
                                <tr key={tag.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition duration-150">
                                    <td className="py-3 px-2 font-medium text-gray-900 w-1/4">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded shadow-sm border border-indigo-100/50">{tag.name}</span>
                                    </td>
                                    <td className="py-3 px-2 text-gray-500 font-medium w-1/4">
                                        {tag.category}
                                    </td>
                                    <td className="py-3 px-2 text-right font-bold text-gray-800 w-1/4 text-lg">
                                        {tag.count}
                                    </td>
                                    <td className="py-3 px-2 text-right text-gray-500 w-1/4">
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="font-semibold text-gray-700">{tag.percent}%</span>
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${tag.percent}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedTags.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-gray-200 rounded-md mt-4">
                            <Target size={24} className="text-gray-300 mb-2" />
                            <p className="text-gray-400 text-sm font-medium">No behavioral tags captured yet.</p>
                        </div>

                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, subtitle }: { title: string, value: string | number, icon: React.ReactNode, subtitle?: string }) {
    return (
        <div className="bg-white p-5 rounded-md border border-gray-200 hover:border-indigo-200 transition duration-300 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-150 group-hover:-rotate-12 transition duration-500">
                {icon}
            </div>
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-50 rounded-md border border-gray-200">{icon}</div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 truncate">{title}</h4>
            </div>
            <div className={`text-3xl font-bold tracking-tight text-gray-900 truncate ${value === '-' && 'text-gray-300'}`}>
                {value}
            </div>
            {subtitle && <p className="text-xs text-gray-500 mt-2 font-medium truncate">{subtitle}</p>}
        </div>
    );
}

function SegmentCard({ name, desc, matchCount, total }: { name: string, desc: string, matchCount: number, total: number }) {
    if (matchCount === 0) return null;
    return (
        <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-md relative overflow-hidden group hover:bg-indigo-50/80 transition cursor-default">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 rounded-l"></div>
            <h4 className="font-semibold text-indigo-950 flex justify-between items-center mb-1.5 tracking-tight text-lg pl-1">
                {name}
                <span className="text-xs font-bold text-indigo-700 bg-white border border-indigo-100 shadow-sm px-2 py-1 flex items-center gap-1 rounded-md">
                    <Users size={12} />{matchCount} / {total}
                </span>
            </h4>
            <p className="text-sm text-indigo-600/70 font-medium pl-1">{desc}</p>
        </div>
    );
}
