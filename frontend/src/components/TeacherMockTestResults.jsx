import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardBody, Badge, StatusBadge, ProgressBar } from './ui.jsx';

export default function TeacherMockTestResults() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [savingEval, setSavingEval] = useState(false);
  const [evalForm, setEvalForm] = useState({ remarks: '', rating: '' });

  useEffect(() => {
    api
      .get('/api/teacher/mocktest/results')
      .then(({ data }) => setAttempts(data || []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, []);

  const groupedByTest = useMemo(() => {
    const map = new Map();
    attempts.forEach((a) => {
      if (!a.mockTestId) return;
      const key = a.mockTestId;
      const prev = map.get(key) || {
        mockTestId: key,
        subject: a.subject,
        topicName: a.topicName,
        difficulty: a.difficulty,
        attempts: []
      };
      prev.attempts.push(a);
      map.set(key, prev);
    });
    return Array.from(map.values());
  }, [attempts]);

  const selectedTest = groupedByTest.find((g) => g.mockTestId === selectedTestId) || null;
  const selectedAttempt =
    attempts.find((a) => a.id === selectedAttemptId) ||
    (selectedTest?.attempts.length ? selectedTest.attempts[0] : null);

  useEffect(() => {
    if (selectedAttempt) {
      setEvalForm({
        remarks: selectedAttempt.evaluation?.remarks || '',
        rating: selectedAttempt.evaluation?.rating ?? ''
      });
    }
  }, [selectedAttemptId, selectedAttempt?.evaluation]);

  const handleSaveEvaluation = async () => {
    if (!selectedAttempt) return;
    setSavingEval(true);
    try {
      const payload = {
        attemptId: selectedAttempt.id,
        remarks: evalForm.remarks,
        rating: evalForm.rating ? Number(evalForm.rating) : undefined
      };
      const { data } = await api.post('/api/teacher/mocktest/evaluate', payload);
      setAttempts((prev) =>
        prev.map((a) =>
          a.id === selectedAttempt.id ? { ...a, evaluation: data.evaluation } : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save evaluation');
    } finally {
      setSavingEval(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Mock Test Results" subtitle="Loading recent mock test attempts..." />
        <CardBody className="py-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mb-3"></div>
            Loading...
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!attempts.length) {
    return (
      <Card>
        <CardHeader
          title="Mock Test Results"
          subtitle="Once students complete mock tests, their results will appear here."
        />
        <CardBody className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <div className="bg-slate-50 dark:bg-dark-bg rounded-xl border border-dashed border-slate-300 dark:border-dark-border p-8 inline-block mt-4">
            No mock test attempts yet. Create and assign tests from the builder.
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader
            title="Mock Tests"
            subtitle="Select a mock test to view student attempts."
          />
          <CardBody className="space-y-2 max-h-[420px] overflow-y-auto">
            {groupedByTest.map((g) => {
              const avgScore =
                g.attempts.length > 0
                  ? Math.round(
                      g.attempts.reduce((sum, a) => sum + (a.score || 0), 0) /
                        g.attempts.length
                    )
                  : 0;
              return (
                <button
                  key={g.mockTestId}
                  type="button"
                  onClick={() => setSelectedTestId(g.mockTestId)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm mb-2 ${
                    selectedTestId === g.mockTestId
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50 shadow-sm'
                      : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-200">
                    {g.subject} <span className="text-slate-400 dark:text-slate-500">— {g.topicName || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-dark-bg px-2 py-0.5 rounded-md border border-slate-200 dark:border-dark-border">{g.attempts.length} attempt(s)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">Avg score: {avgScore}%</span>
                  </div>
                </button>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader
            title="Student Attempts"
            subtitle={
              selectedTest
                ? `${selectedTest.subject} — ${selectedTest.topicName || 'Untitled'}`
                : 'Select a mock test on the left to view attempts.'
            }
          />
          <CardBody>
            {selectedTest ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedTest.attempts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAttemptId(a.id)}
                    className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                      selectedAttemptId === a.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50 shadow-sm'
                        : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="text-left w-full sm:w-auto">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">
                        {a.student?.name} <span className="text-slate-400 dark:text-slate-500 font-normal">({a.student?.email})</span>
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Score: {a.score}% • {a.correctCount}/{a.totalQuestions} correct
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                      <div className="w-24 shrink-0">
                        <ProgressBar value={a.score ?? 0} />
                      </div>
                      <StatusBadge status={a.validationStatus} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 p-8 text-center bg-slate-50/50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-slate-200 dark:border-dark-border">
                Select a mock test on the left to view student attempts.
              </p>
            )}
          </CardBody>
        </Card>

        {selectedAttempt && (
          <Card>
            <CardHeader
              title={`Attempt by ${selectedAttempt.student?.name || 'Student'}`}
              subtitle="Review answers, score, confidence, and add evaluation remarks."
            />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-dark-border text-center">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Score</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedAttempt.score}%
                  </div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/30 text-center">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Correct</div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {selectedAttempt.correctCount}/{selectedAttempt.totalQuestions}
                  </div>
                </div>
                <div className="bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-200 dark:border-sky-800/30 text-center">
                  <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-1">Avg Confidence</div>
                  <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
                    {selectedAttempt.confidenceAtTest
                      ? selectedAttempt.confidenceAtTest.toFixed(1)
                      : '-'}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-dark-border flex flex-col items-center justify-center">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Validation</div>
                  <StatusBadge status={selectedAttempt.validationStatus} />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-dark-border pb-2">Evaluation</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3">
                    <textarea
                      value={evalForm.remarks}
                      onChange={(e) =>
                        setEvalForm((f) => ({ ...f, remarks: e.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-border px-4 py-3 text-sm bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 transition-colors"
                      placeholder="Write remarks on student performance, misconceptions, or next steps."
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Rating (1–5)
                    </label>
                    <select
                      value={evalForm.rating}
                      onChange={(e) =>
                        setEvalForm((f) => ({ ...f, rating: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-border px-4 py-3 text-sm bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                    >
                      <option value="">Not set</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleSaveEvaluation}
                      disabled={savingEval}
                      className="mt-auto inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed w-full shadow-sm shadow-emerald-600/20 transition-all"
                    >
                      {savingEval ? 'Saving...' : 'Save Evaluation'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200/50 dark:border-dark-border pb-2">Question Breakdown</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto text-sm pr-2">
                  {selectedAttempt.questions?.map((q, idx) => {
                    const ans = selectedAttempt.answers?.[idx];
                    return (
                      <div
                        key={q._id || idx}
                        className="rounded-xl p-4 bg-slate-50/50 dark:bg-dark-bg/50 border border-slate-200/50 dark:border-dark-border shadow-sm"
                      >
                        <div className="font-medium text-slate-900 dark:text-slate-100 mb-3 text-base">
                          <span className="text-slate-500 dark:text-slate-400 mr-2">Q{idx + 1}.</span> {q.text}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctIndex === optIdx;
                            const isSelected = ans?.selectedIndex === optIdx;
                            const base =
                              'px-4 py-2.5 rounded-lg border text-xs md:text-sm flex items-center justify-between transition-colors';
                            
                            let styles = 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300';
                            if (isCorrect) {
                              styles = 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-500/50 dark:text-emerald-300 font-medium';
                            } else if (isSelected && !isCorrect) {
                              styles = 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:border-rose-500/50 dark:text-rose-300';
                            }

                            return (
                              <div key={optIdx} className={`${base} ${styles}`}>
                                <span className={isCorrect ? 'font-semibold' : ''}>{opt}</span>
                                {isSelected && (
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                    isCorrect ? 'bg-emerald-200/50 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200' : 'bg-rose-200/50 text-rose-800 dark:bg-rose-800/50 dark:text-rose-200'
                                  }`}>
                                    Student choice
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

