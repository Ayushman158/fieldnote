export interface GeneratedNote {
    questionId: string;
    note: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateNotesFromTranscript(
    transcript: string,
    questions: { id: string, prompt: string }[]
): Promise<GeneratedNote[]> {
    if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY is not set in your .env file.");
    if (!transcript.trim()) return [];

    const systemPrompt = `You are an expert qualitative UX researcher. 
You are given a raw transcript of a user interview, and a list of specific research questions.
Your job is to read the transcript and extract concise, factual notes that answer each question.
Do NOT hallucinate. If the transcript does not contain an answer to a question, return an empty string for that note.
Keep notes brief and in bullet points if applicable.

Return ONLY a JSON array of objects with the exact schema:
[{ "questionId": "string", "note": "string" }]`;

    const userPrompt = `
QUESTIONS TO ANSWER:
${JSON.stringify(questions, null, 2)}

RAW INTERVIEW TRANSCRIPT:
${transcript}
`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: [{
                    parts: [{ text: userPrompt }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Failed to generate notes");
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        return JSON.parse(text) as GeneratedNote[];
    } catch (error) {
        console.error("Gemini AI Error:", error);
        throw error;
    }
}
