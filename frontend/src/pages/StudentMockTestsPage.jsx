import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardBody, StatusBadge, ProgressBar, Pill } from '../components/ui.jsx';
import { ClipboardCheck, Play, CheckCircle2, AlertTriangle, Info, Clock, CheckSquare } from 'lucide-react';

function TestList({ tests, onSelect }) {
  if (!tests.length) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-dark-bg flex items-center justify-center mb-4 border border-slate-200 dark:border-dark-border">
          <ClipboardCheck className="text-slate-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">No Mock Tests Assigned</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
          Once your confidence in topics is high or your teacher identifies a need, they may assign validation tests here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-md">
      <div className="p-6 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <CheckSquare className="text-primary-500" size={20} />
          Assigned Mock Tests
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          You can attempt each mock test once to validate your confidence.
        </p>
      </div>
      <div className="p-3">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {tests.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full text-left rounded-xl border border-slate-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/40 dark:hover:bg-primary-900/10 p-4 transition-all group shadow-sm bg-white dark:bg-dark-bg relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {t.subject} — {t.topicName}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-dark-card dark:text-slate-400 border border-slate-200 dark:border-dark-border">
                      {t.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} /> {t.questionCount} Qs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {t.hasAttempted ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{t.score ?? '-'}%</div>
                      </div>
                      <StatusBadge status={t.validationStatus} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 group-hover:scale-110 transition-transform group-hover:bg-primary-600 group-hover:text-white">
                      <Play size={16} className="ml-1" />
                    </div>
                  )}
                </div>
              </div>
              
              {t.hasAttempted && (
                <div 
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" 
                  style={{ width: `${t.score ?? 0}%` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestRunner({ test, onBack, onSubmitted }) {
  const [answers, setAnswers] = useState(() =>
    Array.from({ length: test.questionCount }, () => null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (qIdx, choice) => {
    setAnswers((prev) => prev.map((a, i) => (i === qIdx ? choice : a)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (answers.some((a) => a === null)) {
      setError('Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/student/submit-test', {
        mockTestId: test.id,
        answers
      });
      onSubmitted(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl shadow-lg border-primary-200 dark:border-primary-900/50 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary-100 text-sm font-semibold mb-2 uppercase tracking-wider">
              <span>{test.subject}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-white/20 backdrop-blur-sm border border-white/20 text-white shadow-sm">{test.difficulty}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">{test.topicName}</h2>
            <p className="text-primary-100 text-sm mt-2 opacity-90 max-w-lg">
              Answer each question carefully. You cannot retake this mock test once submitted.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium backdrop-blur-md transition-colors whitespace-nowrap"
          >
            Exit Test
          </button>
        </div>
      </div>
      
      <div className="p-6 sm:p-8 bg-white dark:bg-dark-bg">
        <form onSubmit={handleSubmit} className="space-y-8">
          {test.questions?.map((q, idx) => (
            <div key={q._id || idx} className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 flex items-center justify-center font-bold font-display text-sm border border-primary-200 dark:border-primary-800/50">
                  {idx + 1}
                </span>
                <p className="text-base font-medium text-slate-800 dark:text-slate-200 pt-1 leading-relaxed">
                  {q.text}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-11">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[idx] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      className={`relative flex items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 dark:border-primary-500 shadow-sm'
                          : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        checked={isSelected}
                        onChange={() => handleChange(idx, optIdx)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mr-3 transition-colors ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-500' 
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                      <span className={`text-sm ${
                        isSelected 
                          ? 'text-primary-900 font-semibold dark:text-primary-200' 
                          : 'text-slate-700 font-medium dark:text-slate-300'
                      }`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {error && (
            <div className="p-4 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-2">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3.5 rounded-xl text-base font-bold bg-primary-600 text-white hover:bg-primary-700 active:scale-95 disabled:opacity-60 disabled:active:scale-100 transition-all shadow-lg shadow-primary-600/25 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>Submit Test</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StudentMockTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/api/student/mocktests')
      .then(({ data }) => {
        setTests(data || []);
      })
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (t) => {
    if (t.hasAttempted) return;
    setResult(null);
    api
      .get(`/api/student/mocktests/${t.id}`)
      .then(({ data }) => {
        setSelected({
          ...t,
          questions: data.questions
        });
      })
      .catch(() => {
        setSelected(null);
      });
  };

  const handleSubmitted = (data) => {
    setResult(data.summary);
    setTests((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? {
              ...t,
              hasAttempted: true,
              score: data.summary.score,
              validationStatus: data.summary.validationStatus
            }
          : t
      )
    );
  };

  const selectedWithQuestions =
    selected && selected.questions
      ? selected
      : selected
      ? {
          ...selected,
          questions: Array.from({ length: selected.questionCount }).map((_, idx) => ({
            _id: idx,
            text: `Question ${idx + 1}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D']
          }))
        }
      : null;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <ClipboardCheck className="text-primary-500" size={32} />
          Validation Tests
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-3xl">
          Complete mock tests to validate how your tracked confidence aligns with your actual performance. Your teacher may assign these based on your activity logs.
        </p>
      </div>

      {loading ? (
        <div className="glass-card rounded-2xl p-16 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-900/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
          Loading your mock tests...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-1 h-[600px]">
            <TestList tests={tests} onSelect={handleSelect} />
          </div>
          
          <div className="lg:col-span-2 space-y-6 h-full min-h-[600px]">
            {selectedWithQuestions ? (
              <TestRunner
                test={selectedWithQuestions}
                onBack={() => { setSelected(null); setResult(null); }}
                onSubmitted={handleSubmitted}
              />
            ) : (
              !result && (
                <div className="glass-card rounded-2xl h-full p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 mb-6 rounded-3xl bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center transform -rotate-6">
                    <ClipboardCheck size={48} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-slate-200 mb-3">Ready to test your knowledge?</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md">
                    Select an assigned mock test from the list on the left to begin. Make sure you have enough time to complete it, as tests cannot be paused once started.
                  </p>
                </div>
              )
            )}

            {result && (
              <div className="glass-card rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-dark-border animate-slide-up">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white text-center">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-white/90" />
                  <h3 className="text-2xl font-display font-bold">Test Completed Successfully!</h3>
                  <p className="text-emerald-100 font-medium opacity-90">Validation results generated</p>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border text-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Score</p>
                      <p className="text-3xl font-display font-bold text-slate-800 dark:text-white">
                        {result.score}%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border text-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Correct Answers</p>
                      <p className="text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400">
                        {result.correctCount}<span className="text-lg text-slate-400">/{result.totalQuestions}</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border text-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pre-test Confidence</p>
                      <p className="text-3xl font-display font-bold text-sky-600 dark:text-sky-400">
                        {result.confidenceAtTest ? result.confidenceAtTest.toFixed(1) : '-'}<span className="text-lg text-slate-400">/5</span>
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border flex flex-col items-center justify-center">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">Validation Status</p>
                      <StatusBadge status={result.validationStatus} />
                    </div>
                  </div>
                  
                  <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-5 flex gap-3 sm:items-start text-sm text-blue-800 dark:text-blue-300">
                    <Info size={20} className="shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>How this works:</strong> Confidence is successfully validated when your declared confidence (≥ 4/5) naturally aligns with a test score of at least 70%. 
                      <span className="font-semibold px-1">Overconfidence</span> indicates high confidence but a low objective score, while 
                      <span className="font-semibold px-1">underconfidence</span> identifies low reported confidence despite strong objective performance.
                    </p>
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => { setResult(null); setSelected(null); }}
                      className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-dark-card text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

