import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { CardSkeleton } from '../components/Skeleton';
import MockTestBuilder from '../components/MockTestBuilder';
import TeacherMockTestResults from '../components/TeacherMockTestResults';
import { Shield, BookOpen, Edit, Trash2, Send, MessageSquare, AlertCircle, Users, Activity, TrendingUp } from 'lucide-react';

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
      <div className="w-full max-w-7xl mx-auto">
        <h1 className="font-display font-bold text-3xl mb-8 text-slate-800 dark:text-white">Teacher Dashboard</h1>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <div className="mb-4">
        <h1 className="font-display font-bold text-3xl mb-2 text-slate-900 dark:text-white flex items-center gap-3">
          <Shield className="text-emerald-500" size={32} />
          Teacher Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Monitor student confidence, manage curriculum skills, create mock tests, and provide direct feedback.
        </p>
      </div>

      {/* Manage Skills */}
      <div className="glass-card rounded-2xl p-6 lg:p-8">
        <h2 className="font-semibold text-xl mb-6 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BookOpen className="text-emerald-500" size={24} />
          Manage Curriculum Skills
        </h2>
        <form onSubmit={handleAddSkill} className="flex flex-wrap gap-4 mb-8">
          <input
            type="text"
            value={skillForm.name}
            onChange={(e) => setSkillForm((f) => ({ ...f, name: e.target.value }))}
            className="px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all w-full md:w-56 placeholder-slate-400"
            placeholder="Skill name"
            required
          />
          <input
            type="text"
            value={skillForm.description}
            onChange={(e) => setSkillForm((f) => ({ ...f, description: e.target.value }))}
            className="px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all flex-1 min-w-[200px] placeholder-slate-400"
            placeholder="Short description (optional)"
          />
          <button
            type="submit"
            disabled={skillSubmitting}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20 whitespace-nowrap"
          >
            {skillSubmitting ? 'Adding...' : '+ Add Skill'}
          </button>
        </form>
        
        <div className="border-t border-slate-200/50 dark:border-dark-border pt-6 mt-4">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">Available Skills List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-slate-300 dark:border-dark-border">
                No skills defined yet. Add the first one above.
              </div>
            ) : (
              skills.map((s) => (
                <div key={s._id} className="relative group bg-white dark:bg-dark-bg border border-slate-200 dark:border-dark-border rounded-xl p-4 transition-all hover:shadow-md dark:hover:border-slate-700">
                  {editingSkill?._id === s._id ? (
                    <form onSubmit={handleUpdateSkill} className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={editSkillForm.name}
                        onChange={(e) => setEditSkillForm((f) => ({ ...f, name: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-card w-full text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <input
                        type="text"
                        value={editSkillForm.description}
                        onChange={(e) => setEditSkillForm((f) => ({ ...f, description: e.target.value }))}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-dark-border bg-slate-50 dark:bg-dark-card w-full text-xs text-slate-600 dark:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Description"
                      />
                      <div className="flex gap-2 mt-1">
                        <button type="submit" className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">Save</button>
                        <button type="button" onClick={() => { setEditingSkill(null); setEditSkillForm({ name: '', description: '' }); }} className="flex-1 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{s.name}</h4>
                        {s.description && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 line-clamp-2">{s.description}</p>}
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-slate-100 dark:border-dark-border">
                        <button
                          type="button"
                          onClick={() => { setEditingSkill(s); setEditSkillForm({ name: s.name, description: s.description || '' }); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                          title="Edit Skill"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(s._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          title="Delete Skill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mock Test Builder & Results Container */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <MockTestBuilder />
        </div>
        <div className="glass-card rounded-2xl p-6 lg:p-8">
          <TeacherMockTestResults />
        </div>
      </div>

      {/* Students View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="p-6 border-b border-slate-200/50 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50">
              <h2 className="font-semibold text-xl text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users size={20} className="text-emerald-500" />
                Student Roster
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-dark-border overflow-y-auto flex-1 p-2">
              {students.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Users size={32} className="mx-auto mb-3 opacity-50" />
                  <p>No students enrolled yet.</p>
                </div>
              ) : (
                students.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => loadStudent(s._id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 my-1 ${
                      selected?.student?._id === s._id 
                        ? 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30 shadow-sm' 
                        : 'hover:bg-slate-50 dark:hover:bg-dark-bg/50 border border-transparent'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mb-0.5">{s.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{s.email}</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      {s.struggling && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30">
                          <AlertCircle size={10} />
                          Struggling
                        </span>
                      )}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        (s.lastConfidence ?? 0) >= 4 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        (s.lastConfidence ?? 0) <= 2 && s.lastConfidence !== null ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        Conf: {s.lastConfidence !== null ? s.lastConfidence.toFixed(1) : '-'} / 5
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-50 dark:bg-dark-bg px-2 py-0.5 rounded-md border border-slate-200 dark:border-dark-border">
                        Logs: {s.confLogCount}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          {selected ? (
            <>
              {/* Selected Student Overview */}
              <div className="glass-card rounded-2xl p-6 lg:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <h2 className="font-display font-bold text-2xl mb-6 text-slate-900 dark:text-white pb-4 border-b border-slate-200/50 dark:border-dark-border">
                  {selected.student?.name}
                  <span className="block text-sm font-medium text-slate-500 mt-1 font-sans">{selected.student?.email}</span>
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100/50 dark:border-indigo-800/30 relative overflow-hidden group">
                    <TrendingUp className="absolute -right-2 -bottom-2 text-indigo-500/10 dark:text-indigo-400/10 group-hover:scale-110 transition-transform" size={64} />
                    <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                      {selected.confidenceLogs?.length || 0}
                    </div>
                    <div className="text-xs font-semibold text-indigo-600/70 dark:text-indigo-400/70 uppercase tracking-wider object-contain z-10 relative">Confidence Logs</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-emerald-800/30 relative overflow-hidden group">
                    <Activity className="absolute -right-2 -bottom-2 text-emerald-500/10 dark:text-emerald-400/10 group-hover:scale-110 transition-transform" size={64} />
                    <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                      {selected.activities?.length || 0}
                    </div>
                    <div className="text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider z-10 relative">Activities</div>
                  </div>
                </div>

                {selected.topicStats?.length > 0 && (
                  <div className="bg-white/50 dark:bg-dark-bg/50 rounded-xl p-5 border border-slate-100 dark:border-dark-border">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <TrendingUp size={18} className="text-slate-400" />
                      Topic Performance Breakdown
                    </h3>
                    <div className="space-y-3">
                      {selected.topicStats.map((t) => (
                        <div key={t.topicId} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{t.topicName}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className={`h-full rounded-full ${
                                  t.avgConfidence <= 2 ? 'bg-rose-500' : 
                                  t.avgConfidence >= 4 ? 'bg-emerald-500' : 
                                  'bg-amber-500'
                                }`}
                                style={{ width: `${(t.avgConfidence / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span
                              className={`font-bold min-w-[60px] text-right ${
                                t.avgConfidence <= 2
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : t.avgConfidence >= 4
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {t.avgConfidence?.toFixed(1)} / 5
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Section */}
              <div className="grid grid-cols-1 gap-6">
                <div className="glass-card rounded-2xl p-6 lg:p-8">
                  <h3 className="font-semibold text-xl mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-500" />
                    Direct Feedback
                  </h3>
                  <form onSubmit={sendFeedback} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={feedback.text}
                      onChange={(e) =>
                        setFeedback((f) => ({ ...f, text: e.target.value }))
                      }
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-dark-border bg-white dark:bg-dark-bg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-400"
                      placeholder="Write feedback, advice, or encouragement..."
                      required
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>

                {selected.feedbacks?.length > 0 && (
                  <div className="glass-card rounded-2xl p-6 lg:p-8">
                    <h3 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">Past Feedback History</h3>
                    <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {selected.feedbacks.map((f) => (
                        <li key={f._id} className="p-4 rounded-xl bg-slate-50/80 dark:bg-dark-bg/60 border border-slate-100 dark:border-dark-border shadow-sm">
                          <p className="text-slate-700 dark:text-slate-300 mb-2">{f.feedback}</p>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">Teacher {f.teacherId?.name}</span>
                            <span>•</span>
                            <span>{new Date(f.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="glass-card rounded-2xl p-16 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-dark-bg flex items-center justify-center mb-6">
                <Users size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">Select a Student</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                Choose a student from the roster on the left to view their detailed performance, confidence trends, and provide direct feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
