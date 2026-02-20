import { useState, useEffect } from 'react';
import { InterviewsProvider } from './context/InterviewsContext';
import NotebookView from './components/NotebookView';
import InsightsView from './components/InsightsView';
import OnboardingFlow from './components/OnboardingFlow';
import StructureEditor from './components/StructureEditor';
import ProjectsView from './components/ProjectsView';
import FeedbackFormModal from './components/FeedbackFormModal';
import SoftFeedbackToasts from './components/SoftFeedbackToasts';
import { LayoutDashboard, PenLine, Settings2, ShieldAlert, ShieldCheck, Heart } from 'lucide-react';
import { useInterviews } from './context/InterviewsContext';
import { initAnalytics, isAnalyticsEnabled, setAnalyticsEnabled, trackEvent } from './analytics';

export function FieldNoteLogo({ className = "" }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="5" y="3" width="14" height="18" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 15l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AppContent() {
  const { activeProjectId, setActiveProjectId } = useInterviews();
  const [activeTab, setActiveTab] = useState<'notebook' | 'insights'>('notebook');
  const [isEditingStructure, setIsEditingStructure] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(isAnalyticsEnabled());

  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      <OnboardingFlow />
      <SoftFeedbackToasts />

      {showFeedbackModal && <FeedbackFormModal onClose={() => setShowFeedbackModal(false)} />}

      {isEditingStructure && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-sm border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            <StructureEditor onCancel={() => setIsEditingStructure(false)} onSave={() => setIsEditingStructure(false)} />
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveProjectId(null)}>
            <div className="text-gray-900 group-hover:text-indigo-600 transition-colors">
              <FieldNoteLogo />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight leading-none flex items-center">
              <span className="text-gray-900">Field</span><span className="text-indigo-600">Note</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-indigo-100 px-3 py-1.5 rounded-md transition"
              title="Give Feedback"
            >
              <Heart size={16} /> <span className="hidden sm:inline">Feedback</span>
            </button>

            <button
              onClick={() => {
                setAnalyticsEnabled(!analyticsOn);
                setAnalyticsOn(!analyticsOn);
                // Requires reload to fully disable script, but this works for future tracking
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-indigo-600 px-2 py-1.5 transition"
              title={analyticsOn ? "Analytics Enabled. Click to disable" : "Analytics Disabled"}
            >
              {analyticsOn ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            </button>

            <button
              onClick={() => {
                trackEvent('structure_customized');
                setIsEditingStructure(true);
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-indigo-100 px-3 py-1.5 rounded-md transition"
              title="Edit Structure"
            >
              <Settings2 size={16} /> <span className="hidden sm:inline">Structure</span>
            </button>

            {activeProjectId && (
              <div className="flex bg-gray-50 p-1 rounded-md border border-gray-200">
                <button
                  onClick={() => setActiveTab('notebook')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition duration-200 ${activeTab === 'notebook'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <PenLine size={16} />
                  Notebook
                </button>
                <button
                  onClick={() => {
                    setActiveTab('insights');
                    trackEvent('insights_viewed', { project_id: activeProjectId });
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition duration-200 ${activeTab === 'insights'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <LayoutDashboard size={16} />
                  Insights
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-8">
        {!activeProjectId ? (
          <ProjectsView />
        ) : (
          activeTab === 'notebook' ? <NotebookView /> : <InsightsView />
        )}
      </main>

      <footer className="w-full text-center py-8 px-4 mt-auto border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex justify-center items-center">
          <p className="text-xs text-gray-500 flex items-center gap-1.5 tracking-tight font-medium transition px-3 py-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            Interview data stays in your browser. No content is stored on external servers.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <InterviewsProvider>
      <AppContent />
    </InterviewsProvider>
  );
}

export default App;
