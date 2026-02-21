import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useInterviews } from '../context/InterviewsContext';
import { TranscriptionService } from '../utils/speech';
import { generateNotesFromTranscript } from '../utils/ai';
import { autoTagNote } from '../utils/autotag';

interface Props {
    categoryId: string;
    onNotesGenerated: () => void;
}

export default function InterviewRecordingView({ categoryId, onNotesGenerated }: Props) {
    const {
        activeInterview,
        updateQuestion,
        tags
    } = useInterviews();

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriber, setTranscriber] = useState<TranscriptionService | null>(null);

    const transcriptRef = useRef<HTMLDivElement>(null);

    const section = activeInterview?.sections.find(s => s.categoryId === categoryId);

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
        }
    }, [transcript]);

    const handleStartRecording = () => {
        setError(null);
        if (!transcriber) {
            const service = new TranscriptionService(
                (text) => {
                    setTranscript(text);
                },
                () => {
                    setIsRecording(false);
                }
            );
            setTranscriber(service);
            service.start();
        } else {
            transcriber.start();
        }
        setIsRecording(true);
    };

    const handleStopRecording = () => {
        if (transcriber) {
            transcriber.stop();
        }
        setIsRecording(false);
    };

    const handleGenerateNotes = async () => {
        if (!transcript.trim()) {
            setError("No transcript recorded yet.");
            return;
        }
        if (!activeInterview || !section) return;

        setIsGenerating(true);
        setError(null);

        try {
            // Prepare questions payload for LLM
            const prompts = section.questions.map(q => ({
                id: q.id,
                prompt: q.prompt || "General Notes"
            }));

            const generatedNotes = await generateNotesFromTranscript(
                transcript,
                prompts
            );

            // Update each question with the generated note
            for (const note of generatedNotes) {
                if (note.note.trim()) {
                    // Run pure-js regex auto-tagger
                    const matchedTagIds = autoTagNote(note.note, tags);

                    updateQuestion(activeInterview.id, categoryId, note.questionId, {
                        notes: note.note,
                        tags: matchedTagIds
                    });
                }
            }

            setTranscript('');
            onNotesGenerated();
        } catch (err: any) {
            setError(err.message || "Failed to generate AI notes.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-gray-50 border border-indigo-200 rounded-md overflow-hidden flex flex-col h-[400px] shadow-[0_0_30px_rgba(79,70,229,0.08)] transition-shadow duration-500">
            {/* Header Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {!isRecording ? (
                        <button
                            onClick={handleStartRecording}
                            className="flex items-center gap-2 bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-rose-200 transition"
                        >
                            <Mic size={16} /> Start Recording
                        </button>
                    ) : (
                        <button
                            onClick={handleStopRecording}
                            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-800 transition shadow-sm animate-pulse"
                        >
                            <Square size={14} className="fill-current" /> Stop Recording
                        </button>
                    )}

                    {isRecording && (
                        <span className="text-xs font-semibold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                            Listening...
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGenerateNotes}
                        disabled={isGenerating || isRecording || !transcript.trim()}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isGenerating ? 'Synthesizing...' : 'Generate Notes'}
                    </button>
                </div>
            </div>

            {/* Transcript Area */}
            <div
                ref={transcriptRef}
                className="flex-1 p-5 overflow-y-auto bg-gray-50/50"
            >
                {transcript ? (
                    <p className="text-gray-700 leading-relaxed font-sans text-[15px] whitespace-pre-wrap">
                        {transcript}
                    </p>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                        <Mic size={32} className="mb-2 opacity-20" />
                        <p className="max-w-xs text-sm">
                            Click Start Recording to transcribe the interview. The AI will parse this raw text to answer your predefined questions.
                        </p>
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
        </div>
    );
}
