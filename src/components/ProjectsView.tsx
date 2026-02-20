import { useState } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import { Plus, Trash2, Folder, LayoutDashboard } from 'lucide-react';

export default function ProjectsView() {
    const { projects, interviews, addProject, deleteProject, setActiveProjectId } = useInterviews();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProjectName.trim()) {
            const p = addProject(newProjectName.trim(), newProjectDesc.trim());
            setNewProjectName('');
            setNewProjectDesc('');
            setIsCreating(false);
            setActiveProjectId(p.id);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Projects</h2>
                    <p className="text-gray-500 mt-1">Organize your qualitative research.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        <Plus size={18} />
                        New Project
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-md border border-indigo-200 shadow-sm transition">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-indigo-500 transition"
                                placeholder="E.g. Q3 User Onboarding"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={newProjectDesc}
                                onChange={(e) => setNewProjectDesc(e.target.value)}
                                className="w-full border border-gray-300 rounded-md p-2 outline-none focus:border-indigo-500 transition"
                                placeholder="Brief summary of the research goals..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newProjectName.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {projects.length === 0 && !isCreating ? (
                    <div className="text-center py-20 bg-white rounded-md border border-gray-200 shadow-sm">
                        <Folder className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                        <p className="text-gray-500">Create a project to start organizing your interviews.</p>
                    </div>
                ) : (
                    projects.map(project => {
                        const projectInterviewsCount = interviews.filter(i => i.projectId === project.id).length;
                        return (
                            <div
                                key={project.id}
                                onClick={() => setActiveProjectId(project.id)}
                                className="bg-white p-5 rounded-md border border-gray-200 hover:border-indigo-600 cursor-pointer transition group relative flex justify-between items-center"
                            >
                                <div className="pr-12">
                                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-900 transition tracking-tight">
                                        {project.name}
                                    </h3>
                                    {project.description && (
                                        <p className="text-gray-500 text-sm mt-1 truncate max-w-lg">{project.description}</p>
                                    )}
                                    <div className="text-xs font-medium text-gray-400 mt-3 flex items-center gap-2">
                                        <LayoutDashboard size={14} />
                                        <span>{projectInterviewsCount} {projectInterviewsCount === 1 ? 'Interview' : 'Interviews'}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete project "${project.name}" and all its interviews?`)) {
                                            deleteProject(project.id);
                                        }
                                    }}
                                    className="absolute right-5 top-5 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition"
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
