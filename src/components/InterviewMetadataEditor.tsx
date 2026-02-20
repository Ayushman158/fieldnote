import { useInterviews } from '../context/InterviewsContext';
import { Calendar, MapPin, Clock, Video } from 'lucide-react';

export default function InterviewMetadataEditor() {
    const { activeInterview, updateInterviewMetadata } = useInterviews();

    if (!activeInterview) return null;

    const m = activeInterview.metadata;

    return (
        <div className="bg-white rounded-md p-6 border border-gray-200">
            <div className="mb-6">
                <input
                    type="text"
                    value={m.participantId}
                    onChange={(e) => updateInterviewMetadata(activeInterview.id, { participantId: e.target.value })}
                    placeholder="Participant ID (e.g. P1 - Commuter)"
                    className="text-3xl font-semibold tracking-tight w-full outline-none placeholder:text-gray-300 bg-transparent"
                />
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                        type="date"
                        value={m.date}
                        onChange={e => updateInterviewMetadata(activeInterview.id, { date: e.target.value })}
                        className="bg-transparent outline-none w-32"
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 focus-within:ring-2 ring-indigo-100 transition">
                    <MapPin size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="City"
                        value={m.city}
                        onChange={e => updateInterviewMetadata(activeInterview.id, { city: e.target.value })}
                        className="bg-transparent outline-none w-24"
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 text-gray-600">
                    <Video size={16} className="text-gray-400" />
                    <select
                        value={m.mode}
                        onChange={e => updateInterviewMetadata(activeInterview.id, { mode: e.target.value as any })}
                        className="bg-transparent outline-none cursor-pointer"
                    >
                        <option value="Live">Live</option>
                        <option value="Transcript">Transcript</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 focus-within:ring-2 ring-indigo-100 transition">
                    <Clock size={16} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Duration (e.g. 45m)"
                        value={m.duration}
                        onChange={e => updateInterviewMetadata(activeInterview.id, { duration: e.target.value })}
                        className="bg-transparent outline-none w-32"
                    />
                </div>
            </div>
        </div>
    );
}
