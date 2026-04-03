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
        <CardBody className="py-6 text-sm text-slate-500">Loading...</CardBody>
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
        <CardBody className="py-6 text-sm text-slate-500">
          No mock test attempts yet.
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
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm mb-1 ${
                    selectedTestId === g.mockTestId
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900">
                    {g.subject} — {g.topicName || 'Untitled'}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                    <span>{g.attempts.length} attempt(s)</span>
                    <span>Avg score: {avgScore}%</span>
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
                      selectedAttemptId === a.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {a.student?.name} <span className="text-slate-400">({a.student?.email})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Score: {a.score}% • {a.correctCount}/{a.totalQuestions} correct
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <ProgressBar value={a.score ?? 0} />
                      </div>
                      <StatusBadge status={a.validationStatus} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Score</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {selectedAttempt.score}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Correct</div>
                  <div className="text-lg font-semibold text-emerald-700">
                    {selectedAttempt.correctCount}/{selectedAttempt.totalQuestions}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Avg Confidence</div>
                  <div className="text-lg font-semibold text-sky-700">
                    {selectedAttempt.confidenceAtTest
                      ? selectedAttempt.confidenceAtTest.toFixed(1)
                      : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Validation</div>
                  <StatusBadge status={selectedAttempt.validationStatus} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">Evaluation</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-3">
                    <textarea
                      value={evalForm.remarks}
                      onChange={(e) =>
                        setEvalForm((f) => ({ ...f, remarks: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Write remarks on student performance, misconceptions, or next steps."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Rating (1–5)
                    </label>
                    <select
                      value={evalForm.rating}
                      onChange={(e) =>
                        setEvalForm((f) => ({ ...f, rating: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                      className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed w-full"
                    >
                      {savingEval ? 'Saving...' : 'Save Evaluation'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-800">Question Breakdown</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto text-sm">
                  {selectedAttempt.questions?.map((q, idx) => {
                    const ans = selectedAttempt.answers?.[idx];
                    return (
                      <div
                        key={q._id || idx}
                        className="border border-slate-200 rounded-lg p-3 bg-slate-50/60"
                      >
                        <div className="font-medium text-slate-900 mb-2">
                          Q{idx + 1}. {q.text}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctIndex === optIdx;
                            const isSelected = ans?.selectedIndex === optIdx;
                            const base =
                              'px-3 py-1.5 rounded border text-xs md:text-sm flex items-center justify-between';
                            const styles = isCorrect
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 bg-white';
                            return (
                              <div key={optIdx} className={`${base} ${styles}`}>
                                <span>{opt}</span>
                                {isSelected && (
                                  <span className="text-xs font-medium text-slate-600">
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

