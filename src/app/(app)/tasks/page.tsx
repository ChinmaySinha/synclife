'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCategoryIcon, getPlayfulMessage } from '@/lib/utils';
import type { Task } from '@/lib/types';

const categories = ['all', 'work', 'health', 'personal', 'other'] as const;

export default function TasksPage() {
  const { profile, partner } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showExcuse, setShowExcuse] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState('');
  const [checkingAi, setCheckingAi] = useState(false);
  const [aiWarning, setAiWarning] = useState<string | null>(null);
  const supabase = createClient();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [scheduledTime, setScheduledTime] = useState('');
  const [shareWithPartner, setShareWithPartner] = useState(false);
  const [notifyPartner, setNotifyPartner] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('daily');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profile) loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadTasks = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .order('created_at', { ascending: true });
    if (data) setTasks(data);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('other');
    setScheduledTime(''); setShareWithPartner(false);
    setNotifyPartner(false); setIsRecurring(false);
    setRecurrenceRule('daily'); setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !title.trim()) return;

    if (!editingTask) {
      // It's a new task, let's ask AI first!
      setCheckingAi(true);
      try {
        const res = await fetch('/api/ai/task-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskTitle: title.trim(), currentTaskCount: tasks.length })
        });
        const data = await res.json();
        
        if (data.shouldWarn) {
          setCheckingAi(false);
          setAiWarning(data.message);
          return; // Stop here and wait for user's decision
        }
      } catch (e) {
        console.error("AI check failed, proceeding anyway", e);
      }
      setCheckingAi(false);
    }
    
    await proceedWithSave();
  };

  const proceedWithSave = async () => {
    if (!profile) return;
    setAiWarning(null);

    const taskData = {
      user_id: profile.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      scheduled_time: scheduledTime ? new Date(`${today}T${scheduledTime}`).toISOString() : null,
      share_with_partner: shareWithPartner,
      notify_partner: notifyPartner,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule : null,
      date: today,
    };

    if (editingTask) {
      await supabase.from('tasks').update(taskData).eq('id', editingTask.id);
    } else {
      await supabase.from('tasks').insert(taskData);
    }

    // Send notification to partner if enabled
    if (notifyPartner && partner) {
      await supabase.from('notifications').insert({
        user_id: partner.id,
        title: 'New Task Alert! 📋',
        body: `${profile.name} added "${title}" and wants you to know!`,
        type: 'task',
      });
    }

    resetForm();
    setShowForm(false);
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    loadTasks();
  };

  const toggleTask = async (task: Task) => {
    const newCompleted = !task.is_completed;
    await supabase.from('tasks').update({
      is_completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }).eq('id', task.id);

    if (newCompleted && profile) {
      await supabase.from('profiles').update({ points: (profile.points || 0) + task.points_value }).eq('id', profile.id);

      if (partner && task.share_with_partner) {
        await supabase.from('activity_feed').insert({
          user_id: profile.id,
          partner_id: partner.id,
          event_type: 'task_completed',
          content: `${profile.name} completed "${task.title}" 💪`,
          emoji: '✅',
        });
      }
    }
    loadTasks();
  };

  const submitExcuse = async () => {
    if (!showExcuse || !excuseText.trim() || !profile) return;
    await supabase.from('excuses').insert({
      task_id: showExcuse,
      user_id: profile.id,
      reason: excuseText.trim(),
    });

    if (partner) {
      const task = tasks.find(t => t.id === showExcuse);
      await supabase.from('activity_feed').insert({
        user_id: profile.id,
        partner_id: partner.id,
        event_type: 'task_excuse',
        content: `${profile.name} explained why "${task?.title}" wasn't done`,
        emoji: '🤷',
      });
    }

    setShowExcuse(null);
    setExcuseText('');
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setShareWithPartner(task.share_with_partner);
    setNotifyPartner(task.notify_partner);
    setIsRecurring(task.is_recurring);
    setRecurrenceRule(task.recurrence_rule || 'daily');
    setAiWarning(null);
    setShowForm(true);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.category === filter);
  const incomplete = tasks.filter(t => !t.is_completed);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>📋 Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tasks.filter(t => t.is_completed).length}/{tasks.length} completed today
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
          + New Task
        </button>
      </div>

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn btn-sm ${filter === cat ? 'btn-primary' : 'btn-secondary'}`}
          >
            {cat === 'all' ? '📌 All' : `${getCategoryIcon(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Incomplete tasks message */}
      {incomplete.length > 0 && (
        <div className="glass-card" style={{
          padding: '12px 16px', marginBottom: '16px',
          background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(236,72,153,0.08) 100%)',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {getPlayfulMessage()} · {incomplete.length} task{incomplete.length > 1 ? 's' : ''} remaining
          </p>
        </div>
      )}

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</p>
            <p style={{ color: 'var(--text-muted)' }}>No tasks here. Add one to get started!</p>
          </div>
        ) : (
          filtered.map(task => (
            <div key={task.id} className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  onClick={() => toggleTask(task)}
                  style={{
                    width: '24px', height: '24px', borderRadius: '7px',
                    border: task.is_completed ? 'none' : '2px solid var(--text-muted)',
                    background: task.is_completed ? 'var(--gradient-primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', color: 'white', cursor: 'pointer', flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {task.is_completed && '✓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '15px', fontWeight: 500,
                    textDecoration: task.is_completed ? 'line-through' : 'none',
                    opacity: task.is_completed ? 0.6 : 1,
                  }}>
                    {task.title}
                  </div>
                  {task.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {task.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${task.category}`}>
                      {getCategoryIcon(task.category)} {task.category}
                    </span>
                    {task.share_with_partner && <span className="badge badge-personal">👥 shared</span>}
                    {task.is_recurring && <span className="badge badge-other">🔄 {task.recurrence_rule}</span>}
                    {task.scheduled_time && (
                      <span className="badge badge-work">
                        🕐 {new Date(task.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => startEdit(task)} className="btn btn-ghost btn-icon" title="Edit">
                    ✏️
                  </button>
                  {!task.is_completed && (
                    <button onClick={() => setShowExcuse(task.id)} className="btn btn-ghost btn-icon" title="Add excuse">
                      🤷
                    </button>
                  )}
                  <button onClick={() => deleteTask(task.id)} className="btn btn-ghost btn-icon" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Form Modal */}
      {showForm && !aiWarning && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>
              {editingTask ? '✏️ Edit Task' : '✨ New Task'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input className="input" placeholder="What needs to be done?" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="input textarea" placeholder="Add details..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="input select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="work">💼 Work</option>
                    <option value="health">💪 Health</option>
                    <option value="personal">✨ Personal</option>
                    <option value="other">📌 Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input className="input" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px' }}>👥 Share with partner</span>
                  <div className={`toggle ${shareWithPartner ? 'active' : ''}`} onClick={() => setShareWithPartner(!shareWithPartner)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px' }}>🔔 Notify partner</span>
                  <div className={`toggle ${notifyPartner ? 'active' : ''}`} onClick={() => setNotifyPartner(!notifyPartner)} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '14px' }}>🔄 Recurring task</span>
                  <div className={`toggle ${isRecurring ? 'active' : ''}`} onClick={() => setIsRecurring(!isRecurring)} />
                </label>
              </div>

              {isRecurring && (
                <div className="form-group">
                  <label>Recurrence</label>
                  <select className="input select" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)}>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" disabled={checkingAi} className="btn btn-primary" style={{ flex: 1, position: 'relative' }}>
                  {checkingAi ? <span className="spinner"></span> : (editingTask ? 'Save Changes' : 'Create Task')}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excuse Modal */}
      {showExcuse && (
        <div className="modal-overlay" onClick={() => { setShowExcuse(null); setExcuseText(''); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>🤷 What happened?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              No judgment! Tell your partner why this didn&apos;t happen.
            </p>
            <textarea
              className="input textarea"
              placeholder="I got caught up with..."
              value={excuseText}
              onChange={e => setExcuseText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={submitExcuse} className="btn btn-primary" style={{ flex: 1 }}>Submit Excuse</button>
              <button onClick={() => { setShowExcuse(null); setExcuseText(''); }} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Warning Modal */}
      {aiWarning && (
        <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setAiWarning(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)' }}>Hang on a second!</h3>
            <p style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '24px' }}>
              {aiWarning}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={proceedWithSave} className="btn btn-danger" style={{ fontWeight: 600 }}>
                Add it anyway 😎
              </button>
              <button 
                onClick={() => { setAiWarning(null); setShowForm(false); resetForm(); }} 
                className="btn btn-secondary"
              >
                You're right, nevermind 😅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
