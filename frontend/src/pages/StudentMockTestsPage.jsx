import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardBody, StatusBadge, ProgressBar, Pill } from '../components/ui.jsx';

function TestList({ tests, onSelect }) {
  if (!tests.length) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-slate-500 text-sm">
          No mock tests assigned yet. Once your confidence in topics is high, teachers may assign
          validation tests here.
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Assigned Mock Tests"
        subtitle="You can attempt each mock test once. Your score will be compared with your confidence level."
      />
      <CardBody>
        <div className="space-y-3">
          {tests.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="w-full text-left rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50/40 px-4 py-3 flex items-center justify-between gap-3 transition"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">
                    {t.subject} — {t.topicName}
                  </h3>
                  <Pill>{t.difficulty}</Pill>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.questionCount} questions • Assigned{' '}
                  {new Date(t.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {t.hasAttempted ? (
                  <>
                    <div className="w-24">
                      <ProgressBar value={t.score ?? 0} />
                      <p className="text-xs text-slate-500 mt-1 text-right">
                        {t.score ?? '-'}%
                      </p>
                    </div>
                    <StatusBadge status={t.validationStatus} />
                  </>
                ) : (
                  <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
                    Not attempted
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
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
    <Card>
      <CardHeader
        title={`${test.subject} — ${test.topicName}`}
        subtitle="Answer each question carefully. You cannot retake this mock test once submitted."
        actions={
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-600 hover:text-slate-900 underline"
          >
            Back to list
          </button>
        }
      />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {test.questions?.map((q, idx) => (
            <div key={q._id || idx} className="space-y-2">
              <p className="text-sm font-medium text-slate-800">
                Q{idx + 1}. {q.text}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                      answers[idx] === optIdx
                        ? 'border-primary-500 bg-primary-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === optIdx}
                      onChange={() => handleChange(idx, optIdx)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="flex-1">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </form>
      </CardBody>
    </Card>
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl mb-1">
          Confidence Validation Tests
        </h1>
        <p className="text-slate-500 text-sm">
          These mock tests validate how your confidence aligns with your performance on
          high-confidence topics.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardBody className="py-10 text-center text-slate-500 text-sm">
            Loading assigned mock tests...
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TestList tests={tests} onSelect={handleSelect} />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {selectedWithQuestions ? (
              <TestRunner
                test={selectedWithQuestions}
                onBack={() => setSelected(null)}
                onSubmitted={handleSubmitted}
              />
            ) : (
              <Card>
                <CardBody className="py-12 text-center text-slate-500 text-sm">
                  Select a mock test on the left to begin.
                </CardBody>
              </Card>
            )}

            {result && (
              <Card>
                <CardHeader
                  title="Result Summary"
                  subtitle="Score vs confidence alignment for this mock test."
                />
                <CardBody>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Score</p>
                      <p className="text-xl font-bold text-slate-900">
                        {result.score}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Correct</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {result.correctCount}/{result.totalQuestions}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Avg Confidence</p>
                      <p className="text-xl font-bold text-sky-700">
                        {result.confidenceAtTest
                          ? result.confidenceAtTest.toFixed(1)
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Status</p>
                      <StatusBadge status={result.validationStatus} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Confidence is considered validated when high confidence (≥ 4/5) aligns with a
                    score of at least 70%. Overconfidence indicates high confidence but low score,
                    while underconfidence indicates low confidence but strong performance.
                  </p>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

