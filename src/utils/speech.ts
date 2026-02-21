// @ts-nocheck
export class TranscriptionService {
    private recognition: any;
    private finalTranscript: string = '';
    private onResultCallback: (text: string, isFinal: boolean) => void;
    private onEndCallback: () => void;
    private isManuallyStopped: boolean = false;

    constructor(onResult: (text: string, isFinal: boolean) => void, onEnd: () => void) {
        this.onResultCallback = onResult;
        this.onEndCallback = onEnd;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech recognition not supported in this browser.");
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    this.finalTranscript += event.results[i][0].transcript + ' ';
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            this.onResultCallback(this.finalTranscript + interimTranscript, false);
        };

        this.recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
        };

        this.recognition.onend = () => {
            if (!this.isManuallyStopped) {
                // Auto-restart if it stopped due to a pause (continuous listening workaround)
                try {
                    this.recognition.start();
                } catch (e) { /* ignore already started errors */ }
            } else {
                this.onEndCallback();
            }
        };
    }

    public start() {
        this.isManuallyStopped = false;
        this.finalTranscript = '';
        if (this.recognition) {
            try {
                this.recognition.start();
            } catch (e) { console.error(e); }
        }
    }

    public stop() {
        this.isManuallyStopped = true;
        if (this.recognition) {
            this.recognition.stop();
        }
        this.onResultCallback(this.finalTranscript, true);
    }
}
