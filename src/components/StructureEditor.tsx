import { useState } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import type { TemplateCategory } from '../types';
import { Plus, GripVertical, Trash2, Tag, Activity, Settings2 } from 'lucide-react';

interface Props {
    onSave: () => void;
    onCancel?: () => void;
}

export default function StructureEditor({ onSave, onCancel }: Props) {
    const { templateCategories, setTemplateCategories, applyTemplateToAllInterviews, interviews, activeProjectId } = useInterviews();
    const [draftCategories, setDraftCategories] = useState<TemplateCategory[]>([...templateCategories]);

    const addCategory = () => {
        const newCat: TemplateCategory = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: '',
            enableStress: false,
            enableTags: true
        };
        setDraftCategories([...draftCategories, newCat]);
    };

    const updateCategory = (id: string, updates: Partial<TemplateCategory>) => {
        setDraftCategories(draftCategories.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCategory = (id: string) => {
        setDraftCategories(draftCategories.filter(c => c.id !== id));
    };

    // Simplistic local move (not using full dnd lib to keep it lightweight)
    const moveUp = (index: number) => {
        if (index === 0) return;
        const newArr = [...draftCategories];
        [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
        setDraftCategories(newArr);
    };

    const moveDown = (index: number) => {
        if (index === draftCategories.length - 1) return;
        const newArr = [...draftCategories];
        [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
        setDraftCategories(newArr);
    };

    const handleSave = () => {
        // Basic validation: name cannot be empty
        const valid = draftCategories.filter(c => c.name.trim() !== '');
        if (valid.length === 0) {
            alert('You must have at least one named category.');
            return;
        }

        const projectInterviews = interviews.filter(i => activeProjectId ? i.projectId === activeProjectId : true);

        if (projectInterviews.length > 0 && onCancel) {
            const applyAll = confirm("Do you want to apply this updated structure to ALL existing interviews in this project?\n\n- Click 'OK' to apply to all existing interviews (WARNING: Unmatched deleted sections will be hidden).\n- Click 'Cancel' to ONLY apply to future new interviews.");
            if (applyAll) {
                applyTemplateToAllInterviews(valid);
            } else {
                setTemplateCategories(valid);
            }
        } else {
            setTemplateCategories(valid);
        }

        onSave();
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-white w-full">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur z-10">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Settings2 size={20} className="text-gray-400" />
                        Customize Structure
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Define the sections and behaviors for your interviews.</p>
                </div>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 px-2 py-1">Close</button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4 bg-gray-50/30">
                {draftCategories.map((cat, idx) => (
                    <div key={cat.id} className="bg-white border border-gray-200 rounded-md p-4 flex gap-4 transition hover:border-indigo-300">
                        <div className="flex flex-col gap-1 items-center justify-center text-gray-300">
                            <button onClick={() => moveUp(idx)} className={`hover:text-indigo-600 ${idx === 0 ? 'invisible' : ''}`}>▲</button>
                            <GripVertical size={16} />
                            <button onClick={() => moveDown(idx)} className={`hover:text-indigo-600 ${idx === draftCategories.length - 1 ? 'invisible' : ''}`}>▼</button>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={cat.name}
                                    onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                                    placeholder="Category Name (e.g. Pre-trip Context)"
                                    className="w-full text-lg font-medium p-2 border-b border-gray-200 focus:border-indigo-500 outline-none bg-transparent transition"
                                />
                            </div>

                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                                    <input
                                        type="checkbox"
                                        checked={cat.enableStress}
                                        onChange={(e) => updateCategory(cat.id, { enableStress: e.target.checked })}
                                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                    />
                                    <Activity size={16} className={cat.enableStress ? "text-red-400" : "text-gray-300"} />
                                    Enable Stress tracking
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900">
                                    <input
                                        type="checkbox"
                                        checked={cat.enableTags}
                                        onChange={(e) => updateCategory(cat.id, { enableTags: e.target.checked })}
                                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                                    />
                                    <Tag size={16} className={cat.enableTags ? "text-indigo-400" : "text-gray-300"} />
                                    Enable Tags
                                </label>
                            </div>
                        </div>

                        <div className="pl-4 border-l border-gray-100 flex items-start">
                            <button
                                onClick={() => deleteCategory(cat.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                                title="Delete Category"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                <button
                    onClick={addCategory}
                    className="w-full py-4 border-2 border-dashed border-gray-200 text-gray-500 font-medium rounded-md hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Add Category
                </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-white">
                <button
                    onClick={handleSave}
                    className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-md hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                    Save Structure
                </button>
            </div>
        </div>
    );
}
