import { useState, useRef, useEffect } from 'react';
import { useInterviews } from '../context/InterviewsContext';
import type { Tag } from '../types';
import { X, Hash } from 'lucide-react';

interface Props {
    selectedTags: string[];
    onToggleTag: (id: string) => void;
}

export default function TagSelector({ selectedTags, onToggleTag }: Props) {
    const { tags, addCustomTag } = useInterviews();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef]);

    const filteredTags = tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    const selectedTagDefs = selectedTags.map(id => tags.find(t => t.id === id)).filter(Boolean) as Tag[];

    const handleCreateNew = () => {
        if (search.trim()) {
            const newTag = addCustomTag(search.trim(), 'Behaviour'); // Defaulting custom to behavior for simplicity
            onToggleTag(newTag.id);
            setSearch('');
        }
    };

    const tagColor = (category: string) => {
        switch (category) {
            case 'Behaviour': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Motivation': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Friction': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Impact': return 'bg-purple-50 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Selected Tags Display */}
            <div
                className="min-h-12 p-2 bg-gray-50 border border-gray-200 rounded-md flex flex-wrap gap-2 items-center cursor-text hover:border-indigo-300 transition"
                onClick={() => setIsOpen(true)}
            >
                {selectedTagDefs.map(t => (
                    <span
                        key={t.id}
                        className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 ${tagColor(t.category)}`}
                    >
                        {t.name}
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleTag(t.id); }}
                            className="opacity-60 hover:opacity-100 focus:outline-none"
                        >
                            <X size={12} />
                        </button>
                    </span>
                ))}
                {selectedTagDefs.length === 0 && !isOpen && (
                    <span className="text-gray-400 text-sm px-2">Select or create tags...</span>
                )}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={selectedTagDefs.length > 0 ? "" : isOpen ? "Search or create..." : ""}
                    className="flex-1 min-w-24 bg-transparent outline-none text-sm placeholder:text-gray-400 p-1"
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredTags.length > 0) {
                                onToggleTag(filteredTags[0].id);
                                setSearch('');
                            } else if (search.trim()) {
                                handleCreateNew();
                            }
                        }
                    }}
                />
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-md shadow-sm border border-gray-200 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                    {search && filteredTags.length === 0 && (
                        <div
                            className="p-3 cursor-pointer hover:bg-gray-50 flex items-center gap-2 border-b text-sm"
                            onClick={handleCreateNew}
                        >
                            <span className="bg-indigo-100 text-indigo-700 p-1 rounded"><Hash size={16} /></span>
                            <span>Create new tag <strong>"{search}"</strong></span>
                        </div>
                    )}

                    {filteredTags.length > 0 && (
                        <div className="p-2 space-y-4">
                            {['Behaviour', 'Motivation', 'Friction', 'Impact'].map(category => {
                                const groupTags = filteredTags.filter(t => t.category === category);
                                if (groupTags.length === 0) return null;
                                return (
                                    <div key={category}>
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-2 mb-2">{category}</h4>
                                        <div className="flex flex-wrap gap-1 px-1">
                                            {groupTags.map(tag => {
                                                const isSelected = selectedTags.includes(tag.id);
                                                return (
                                                    <button
                                                        key={tag.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleTag(tag.id);
                                                            setSearch('');
                                                        }}
                                                        className={`text-xs px-2.5 py-1.5 rounded-md border text-left transition ${isSelected
                                                            ? tagColor(tag.category)
                                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {tag.name}
                                                    </button>
                                                );
                                            })}
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
