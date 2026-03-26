import { useEffect, useState } from 'react';
import api from '../services/api';
import { Card, CardHeader, CardBody, Badge } from './ui.jsx';

const emptyQuestion = () => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0
});

export default function MockTestBuilder() {
  const [topicGroups, setTopicGroups] = useState({ my: [], global: [] });
  const [form, setForm] = useState({
    topicId: '',
    difficulty: 'medium'
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', description: '' });
  const [addingSkill, setAddingSkill] = useState(false);

  const refreshTopics = () => {
    setLoadingTopics(true);
    api
      .get('/api/teacher/topics')
      .then(({ data }) => setTopicGroups({ my: data.my || [], global: data.global || [] }))
      .catch(() => {})
      .finally(() => setLoadingTopics(false));
  };

  useEffect(() => {
    refreshTopics();
  }, []);

  const updateQuestion = (index, updater) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updater(q) } : q))
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.topicId) {
      setToast({ type: 'error', message: 'Please select a skill or topic' });
      return;
    }
    if (!questions.length) {
      setToast({ type: 'error', message: 'Add at least one question' });
      return;
    }
    const [kind, id] = form.topicId.split(':');
    const payload = {
      ...(kind === 'skill' ? { skillId: id } : { topicId: id }),
      difficulty: form.difficulty,
      questions: questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex
      }))
    };
    setSubmitting(true);
    try {
      const { data } = await api.post('/api/teacher/mocktest', payload);
      const assigned = data.assignedCount || 0;
      setToast({
        type: 'success',
        message:
          assigned > 0
            ? `Mock test created and assigned to ${assigned} high-confidence students`
            : 'Mock test created but no students currently meet the confidence threshold'
      });
      setQuestions([emptyQuestion()]);
      setForm((f) => ({ ...f, topicId: '' }));
      refreshTopics();
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.message || 'Failed to create mock test'
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-lg text-slate-900 dark:text-white">
            Confidence Validation Mock Test
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create MCQ mock tests for topics. Tests are automatically assigned to students whose
            average confidence is&nbsp;
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">≥ 4</span>.
          </p>
        </div>
        <Badge variant="info">Teacher-only</Badge>
      </div>

      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/50'
              : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800/50'
          }`}
        >
          {toast.message}
        </div>
      )}

      <Card>
        <CardHeader
          title="Mock Test Builder"
          subtitle="Select a topic, choose difficulty, then compose MCQ questions."
        />
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Skill / Topic
                </label>
                <select
                  value={form.topicId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, topicId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-dark-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 transition-colors"
                  disabled={loadingTopics}
                >
                  <option value="">Select a Skill / Topic</option>
                  {topicGroups.my.length === 0 && topicGroups.global.length === 0 && (
                    <option value="" disabled>
                      No skills or topics yet — create one below.
                    </option>
                  )}
                  {topicGroups.my.length > 0 && (
                    <optgroup label="My Skills / Topics">
                      {topicGroups.my.map((t) => (
                        <option key={`${t.kind}:${t.id}`} value={`${t.kind}:${t.id}`}>
                          {t.subject ? `${t.subject} — ${t.name}` : t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {topicGroups.global.length > 0 && (
                    <optgroup label="Global Topics">
                      {topicGroups.global.map((t) => (
                        <option key={`${t.kind}:${t.id}`} value={`${t.kind}:${t.id}`}>
                          {t.subject ? `${t.subject} — ${t.name}` : t.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                  Only students with high confidence in the selected skill or topic will receive the test.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, difficulty: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-dark-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-dark-border pt-4">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Need a new skill?</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Create a skill inline and it will appear under &quot;My Skills / Topics&quot;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingSkill((v) => !v)}
                  className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors"
                >
                  {addingSkill ? 'Cancel' : 'Add New Skill'}
                </button>
              </div>

              {addingSkill && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) =>
                      setNewSkill((s) => ({ ...s, name: e.target.value }))
                    }
                    className="rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-200"
                    placeholder="Skill name"
                  />
                  <input
                    type="text"
                    value={newSkill.description}
                    onChange={(e) =>
                      setNewSkill((s) => ({ ...s, description: e.target.value }))
                    }
                    className="rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none text-slate-800 dark:text-slate-200"
                    placeholder="Description (optional)"
                  />
                  <button
                    type="button"
                    disabled={!newSkill.name.trim()}
                    onClick={async () => {
                      try {
                        const { data } = await api.post('/api/skills', {
                          name: newSkill.name.trim(),
                          description: newSkill.description.trim()
                        });
                        setNewSkill({ name: '', description: '' });
                        setAddingSkill(false);
                        refreshTopics();
                        setForm((f) => ({ ...f, topicId: `skill:${data._id}` }));
                        setToast({
                          type: 'success',
                          message: 'Skill created and selected for this mock test.'
                        });
                      } catch (err) {
                        setToast({
                          type: 'error',
                          message: err.response?.data?.message || 'Failed to create skill'
                        });
                      }
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Save Skill
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-dark-border pt-6 mt-6">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Questions ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-slate-100/50 dark:bg-dark-bg text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-dark-border transition-colors"
                >
                  + Add Question
                </button>
              </div>

              {questions.length === 0 && (
                <p className="text-sm text-slate-500">
                  No questions yet. Click &quot;Add Question&quot; to begin.
                </p>
              )}

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Question {idx + 1}
                      </span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 hover:underline transition-colors font-medium"
                        >
                          Remove Question
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(idx, () => ({ text: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200 transition-colors"
                      placeholder="Enter question text"
                      required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors ${
                            q.correctIndex === optIdx
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 dark:border-primary-500/50'
                              : 'border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${idx}-correct`}
                            checked={q.correctIndex === optIdx}
                            onChange={() =>
                              updateQuestion(idx, () => ({
                                correctIndex: optIdx
                              }))
                            }
                            className="text-primary-600 focus:ring-primary-500 rounded-full border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700 focus:outline-none ring-offset-white dark:ring-offset-dark-bg"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              updateQuestion(idx, (prev) => ({
                                options: prev.options.map((o, i) =>
                                  i === optIdx ? e.target.value : o
                                )
                              }))
                            }
                            className="flex-1 border-0 bg-transparent focus:outline-none text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder={`Option ${optIdx + 1}`}
                            required
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm shadow-emerald-500/20"
              >
                {submitting ? 'Creating Mock Test...' : 'Create & Assign Mock Test'}
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

