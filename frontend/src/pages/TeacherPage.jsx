import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import MockTestBuilder from '../components/MockTestBuilder';
import TeacherMockTestResults from '../components/TeacherMockTestResults';

export default function TeacherPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ studentId: '', text: '' });
  const [sending, setSending] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: '', description: '' });
  const [skillSubmitting, setSkillSubmitting] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editSkillForm, setEditSkillForm] = useState({ name: '', description: '' });

  useEffect(() => {
    Promise.all([
      api.get('/api/teacher/students'),
      api.get('/api/skills')
    ])
      .then(([studentsRes, skillsRes]) => {
        setStudents(studentsRes.data);
        setSkills(skillsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSkills = () => {
    api.get('/api/skills').then(({ data }) => setSkills(data)).catch(() => {});
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!skillForm.name.trim()) return;
    setSkillSubmitting(true);
    try {
      await api.post('/api/skills', skillForm);
      setSkillForm({ name: '', description: '' });
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add skill');
    } finally {
      setSkillSubmitting(false);
    }
  };

  const handleUpdateSkill = async (e) => {
    e.preventDefault();
    if (!editingSkill || !editSkillForm.name.trim()) return;
    try {
      await api.put(`/api/skills/${editingSkill._id}`, editSkillForm);
      setEditingSkill(null);
      setEditSkillForm({ name: '', description: '' });
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!confirm('Delete this skill? Students may have used it.')) return;
    try {
      await api.delete(`/api/skills/${id}`);
      loadSkills();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const loadStudent = (id) => {
    api.get(`/api/teacher/student/${id}`).then(({ data }) => {
      setSelected(data);
      setFeedback((f) => ({ ...f, studentId: id }));
    });
  };

  const sendFeedback = async (e) => {
    e.preventDefault();
    if (!feedback.text.trim()) return;
    setSending(true);
    try {
      await api.post('/api/teacher/feedback', {
        studentId: feedback.studentId,
        feedback: feedback.text
      });
      setFeedback((f) => ({ ...f, text: '' }));
      if (selected) {
        const { data } = await api.get(`/api/teacher/student/${feedback.studentId}`);
        setSelected(data);
      }
    } catch (err) {
      alert('Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-bold text-2xl mb-6">Teacher Dashboard</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-2">Teacher Dashboard</h1>
      <p className="text-slate-500 mb-6">
        View student confidence, detect struggling students, manage skills, create mock tests, and
        add feedback.
      </p>

      {/* Manage Skills */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-lg mb-4">Manage Skills</h2>
        <form onSubmit={handleAddSkill} className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            value={skillForm.name}
            onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-2 rounded-lg border border-slate-300 w-48"
            placeholder="Skill name"
            required
          />
          <input
            type="text"
            value={skillForm.description}
            onChange={(e) => setSkillForm((f) => ({ ...f, description: e.target.value }))}
            className="px-4 py-2 rounded-lg border border-slate-300 flex-1 min-w-[200px]"
            placeholder="Description (optional)"
          />
          <button
            type="submit"
            disabled={skillSubmitting}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {skillSubmitting ? 'Adding...' : 'Add Skill'}
          </button>
        </form>
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Skills list (students use these in dropdowns)</h3>
          <ul className="space-y-2">
            {skills.length === 0 ? (
              <li className="text-slate-500 text-sm">No skills yet. Add one above.</li>
            ) : (
              skills.map((s) => (
                <li key={s._id} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                  {editingSkill?._id === s._id ? (
                    <form onSubmit={handleUpdateSkill} className="flex flex-wrap gap-2 flex-1">
                      <input
                        type="text"
                        value={editSkillForm.name}
                        onChange={(e) => setEditSkillForm((f) => ({ ...f, name: e.target.value }))}
                        className="px-3 py-1.5 rounded border border-slate-300 flex-1 min-w-[120px]"
                      />
                      <input
                        type="text"
                        value={editSkillForm.description}
                        onChange={(e) => setEditSkillForm((f) => ({ ...f, description: e.target.value }))}
                        className="px-3 py-1.5 rounded border border-slate-300 flex-1 min-w-[120px]"
                        placeholder="Description"
                      />
                      <button type="submit" className="px-3 py-1.5 rounded bg-primary-600 text-white text-sm">Save</button>
                      <button type="button" onClick={() => { setEditingSkill(null); setEditSkillForm({ name: '', description: '' }); }} className="px-3 py-1.5 rounded bg-slate-200 text-sm">Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">{s.name}</span>
                        {s.description && <span className="text-slate-500 text-sm ml-2">— {s.description}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setEditingSkill(s); setEditSkillForm({ name: s.name, description: s.description || '' }); }}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(s._id)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Mock Test Builder */}
      <div className="mb-8">
        <MockTestBuilder />
      </div>

      {/* Mock Test Results & Evaluation */}
      <div className="mb-8">
        <TeacherMockTestResults />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <h2 className="font-semibold p-4 border-b">Students</h2>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {students.length === 0 ? (
                <p className="p-4 text-slate-500">No students</p>
              ) : (
                students.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => loadStudent(s._id)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition ${
                      selected?.student?._id === s._id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-slate-500">{s.email}</div>
                    <div className="flex gap-2 mt-1">
                      {s.struggling && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          Struggling
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Conf: {s.lastConfidence ?? '-'} | Logs: {s.confLogCount}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selected ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-lg mb-4">
                  {selected.student?.name} - Overview
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <div className="text-2xl font-bold text-primary-600">
                      {selected.confidenceLogs?.length || 0}
                    </div>
                    <div className="text-sm text-slate-500">Confidence Logs</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <div className="text-2xl font-bold text-emerald-600">
                      {selected.activities?.length || 0}
                    </div>
                    <div className="text-sm text-slate-500">Activities</div>
                  </div>
                </div>

                {selected.topicStats?.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Topic Performance</h3>
                    <div className="space-y-2">
                      {selected.topicStats.map((t) => (
                        <div key={t.topicId} className="flex justify-between text-sm">
                          <span>{t.topicName}</span>
                          <span
                            className={
                              t.avgConfidence <= 2
                                ? 'text-red-600'
                                : t.avgConfidence >= 4
                                ? 'text-green-600'
                                : 'text-amber-600'
                            }
                          >
                            Avg: {t.avgConfidence?.toFixed(1)}/5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-semibold mb-3">Add Feedback</h3>
                <form onSubmit={sendFeedback} className="flex gap-2">
                  <input
                    type="text"
                    value={feedback.text}
                    onChange={(e) =>
                      setFeedback((f) => ({ ...f, text: e.target.value }))
                    }
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300"
                    placeholder="Write feedback for student..."
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>

              {selected.feedbacks?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold mb-3">Past Feedback</h3>
                  <ul className="space-y-2">
                    {selected.feedbacks.map((f) => (
                      <li key={f._id} className="p-3 rounded-lg bg-slate-50 text-sm">
                        {f.feedback}
                        <span className="text-slate-400 block mt-1">
                          by {f.teacherId?.name} • {new Date(f.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              Select a student to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
