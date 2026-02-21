import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, Loader2, AlertCircle, Settings } from 'lucide-react';
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
        geminiApiKey,
        setGeminiApiKey,
        updateQuestion,
        tags
    } = useInterviews();

    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcriber, setTranscriber] = useState<TranscriptionService | null>(null);
    const [showKeyInput, setShowKeyInput] = useState(!geminiApiKey);
    const [tempKey, setTempKey] = useState(geminiApiKey || '');

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
        if (!geminiApiKey) {
            setShowKeyInput(true);
            return;
        }
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
                geminiApiKey,
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

    const saveApiKey = () => {
        if (tempKey.trim().length > 10) {
            setGeminiApiKey(tempKey.trim());
            setShowKeyInput(false);
            setError(null);
        } else {
            setError("Invalid API Key format.");
        }
    };

    if (showKeyInput) {
        return (
            <div className="bg-white border border-indigo-100 p-6 rounded-md">
                <div className="flex items-center gap-3 mb-4 text-indigo-700">
                    <Sparkles size={20} />
                    <h3 className="font-semibold">Enable AI Data Entry</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4 max-w-lg">
                    FieldNote uses the free Google Gemini API to extract structured notes from your live raw transcripts.
                    Your key is stored securely in your browser's local storage.
                </p>

                <div className="flex gap-2">
                    <input
                        type="password"
                        placeholder="Paste your Gemini AI Key (AIza...)"
                        value={tempKey}
                        onChange={e => setTempKey(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:border-indigo-500 outline-none text-sm"
                    />
                    <button
                        onClick={saveApiKey}
                        className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        Save Key
                    </button>
                    {geminiApiKey && (
                        <button
                            onClick={() => setShowKeyInput(false)}
                            className="text-gray-500 px-3 hover:text-gray-700 text-sm font-medium"
                        >
                            Cancel
                        </button>
                    )}
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <p className="text-xs text-gray-400 mt-4">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">
                        Get a free Gemini API key here
                    </a>
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 border border-gray-200 rounded-md overflow-hidden flex flex-col h-[400px]">
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
                        onClick={() => setShowKeyInput(true)}
                        className="text-gray-400 hover:text-indigo-600 transition"
                        title="AI Settings"
                    >
                        <Settings size={16} />
                    </button>
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
