import { useState } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import { DEFAULT_TEMPLATE_CATEGORIES } from '../constants';
import StructureEditor from './StructureEditor';
import { Settings2, CheckCircle2 } from 'lucide-react';

export default function OnboardingFlow() {
    const { onboardingCompleted, setOnboardingCompleted, setTemplateCategories, addProject, setActiveProjectId } = useInterviews();
    const [step, setStep] = useState<'PROJECT' | 'CHOICE' | 'CUSTOM'>('PROJECT');
    const [projectName, setProjectName] = useState('');

    if (onboardingCompleted) return null;

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectName.trim()) {
            const p = addProject(projectName.trim(), 'My first qualitative research project');
            setActiveProjectId(p.id);
            setStep('CHOICE');
        }
    };

    const handleSelectDefault = () => {
        setTemplateCategories(DEFAULT_TEMPLATE_CATEGORIES);
        setOnboardingCompleted(true);
    };

    if (step === 'CUSTOM') {
        return (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                    <StructureEditor onSave={() => setOnboardingCompleted(true)} />
                </div>
            </div>
        );
    }

    if (step === 'PROJECT') {
        return (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-md p-8 max-w-xl w-full shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                    <h2 className="text-2xl font-semibold mb-2">Welcome to FieldNote</h2>
                    <p className="text-gray-500 mb-8">
                        Let's start by creating your first project to organize your qualitative research.
                    </p>
                    <form onSubmit={handleCreateProject} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-3 outline-none focus:border-indigo-500 transition text-lg"
                                placeholder="E.g. Q3 User Onboarding"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!projectName.trim()}
                            className="w-full py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                        >
                            Continue
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md p-8 max-w-xl w-full shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
                <h2 className="text-2xl font-semibold mb-2">Setup Interview Structure</h2>
                <p className="text-gray-500 mb-8">
                    Choose a starting point for your research questions.
                </p>

                <div className="grid gap-4">
                    <button
                        onClick={handleSelectDefault}
                        className="text-left group border border-gray-200 hover:border-indigo-600 bg-gray-50 hover:bg-white p-6 rounded-md transition duration-200 flex items-start gap-4"
                    >
                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-900 mb-1">Recommended Structure</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Uses standard stages: Context, Decisions, Actions, and Impact. You can customize this later.
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => setStep('CUSTOM')}
                        className="text-left group border border-gray-200 hover:border-indigo-600 bg-gray-50 hover:bg-white p-6 rounded-md transition duration-200 flex items-start gap-4"
                    >
                        <div className="bg-gray-200 text-gray-600 p-2 rounded shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition">
                            <Settings2 size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-900 mb-1">Customize Your Own</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Start from scratch. Define custom categories, tracking, and tag configurations.
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
