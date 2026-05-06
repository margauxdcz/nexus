import React, { useState, useEffect } from 'react';

const PRIORITIES = ['Low', 'Medium', 'High'];

const PRIORITY_COLORS = {
  Low: { bg: '#E1F5EE', text: '#085041', border: '#a8dba8' },
  Medium: { bg: '#FAEEDA', text: '#633806', border: '#FAC775' },
  High: { bg: '#FCEBEB', text: '#501313', border: '#F7C1C1' }
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function isOverdue(dateStr, done) {
  if (done) return false;
  return new Date(dateStr) < new Date();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function Deliverables({ teamId }) {
  const storageKey = `deliverables-${teamId}`;
  const membersKey = `availability-${teamId}`;

  const [deliverables, setDeliverables] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const [form, setForm] = useState({
    title: '', deadline: '', priority: 'Medium', assignees: [], notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setDeliverables(JSON.parse(saved));
    const savedMembers = localStorage.getItem(membersKey);
    if (savedMembers) {
      const data = JSON.parse(savedMembers);
      setMembers(data.members || []);
    }
  }, [teamId]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(deliverables));
  }, [deliverables]);

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleAssignee(name) {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(name)
        ? prev.assignees.filter(a => a !== name)
        : [...prev.assignees, name]
    }));
  }

  function addDeliverable() {
    if (!form.title.trim() || !form.deadline) return;
    const newItem = {
      id: Date.now(),
      title: form.title.trim(),
      deadline: form.deadline,
      priority: form.priority,
      assignees: form.assignees,
      notes: form.notes.trim(),
      done: false,
      createdAt: new Date().toISOString()
    };
    setDeliverables(prev => [...prev, newItem].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
    setForm({ title: '', deadline: '', priority: 'Medium', assignees: [], notes: '' });
    setShowForm(false);
  }

  function toggleDone(id) {
    setDeliverables(prev => prev.map(d => d.id === id ? { ...d, done: !d.done } : d));
  }

  function deleteDeliverable(id) {
    setDeliverables(prev => prev.filter(d => d.id !== id));
  }

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

  function getDeliverablesForDay(day) {
    const date = new Date(year, month, day);
    return deliverables.filter(d => isSameDay(new Date(d.deadline), date));
  }

  const selectedDayDeliverables = selectedDay ? getDeliverablesForDay(selectedDay) : [];

  const sorted = [...deliverables].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Deliverables</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
            {deliverables.filter(d => !d.done).length} pending · {deliverables.filter(d => d.done).length} done
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Deliverable'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">New Deliverable</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Title e.g. Submit Chapter 1"
              value={form.title}
              onChange={e => handleFormChange('title', e.target.value)}
              style={{ width: '100%' }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Deadline</div>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={e => handleFormChange('deadline', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Priority</div>
                <select
                  value={form.priority}
                  onChange={e => handleFormChange('priority', e.target.value)}
                  style={{ width: '100%' }}
                >
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {members.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Assign to</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {members.map(m => (
                    <div
                      key={m}
                      onClick={() => toggleAssignee(m)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 12,
                        cursor: 'pointer', transition: 'all 0.15s',
                        border: `1.5px solid ${form.assignees.includes(m) ? '#1D9E75' : '#e0e0de'}`,
                        background: form.assignees.includes(m) ? '#E1F5EE' : '#fff',
                        color: form.assignees.includes(m) ? '#085041' : '#555',
                        fontWeight: form.assignees.includes(m) ? 500 : 400
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Notes (optional)</div>
              <textarea
                placeholder="Any extra details..."
                value={form.notes}
                onChange={e => handleFormChange('notes', e.target.value)}
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={addDeliverable}
              style={{ alignSelf: 'flex-start' }}
            >
              Add Deliverable
            </button>
          </div>
        </div>
      )}

      {/* Deliverables list */}
      {sorted.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
          No deliverables yet — add your first one above.
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          {sorted.map(d => {
            const overdue = isOverdue(d.deadline, d.done);
            const pc = PRIORITY_COLORS[d.priority];
            return (
              <div key={d.id} className="card" style={{
                opacity: d.done ? 0.6 : 1,
                borderLeft: `4px solid ${pc.border}`,
                transition: 'opacity 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Checkbox */}
                  <div
                    onClick={() => toggleDone(d.id)}
                    style={{
                      width: 18, height: 18, borderRadius: 5, marginTop: 2,
                      border: `2px solid ${d.done ? '#1D9E75' : '#ddd'}`,
                      background: d.done ? '#1D9E75' : '#fff',
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    {d.done && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 14, fontWeight: 500,
                        textDecoration: d.done ? 'line-through' : 'none',
                        color: d.done ? '#aaa' : '#1a1a1a'
                      }}>
                        {d.title}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: pc.bg, color: pc.text, fontWeight: 500
                      }}>
                        {d.priority}
                      </span>
                      {overdue && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 20,
                          background: '#FCEBEB', color: '#A32D2D', fontWeight: 500
                        }}>
                          Overdue
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: overdue ? '#A32D2D' : '#888', marginTop: 3 }}>
                      📅 {formatDateTime(d.deadline)}
                    </div>

                    {d.assignees.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {d.assignees.map(a => (
                          <span key={a} style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: '#f0f0ee', color: '#555'
                          }}>
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {d.notes && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic' }}>
                        {d.notes}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button className="btn-danger" onClick={() => deleteDeliverable(d.id)}>×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="card">
        {/* Calendar nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button className="btn btn-ghost" style={{ padding: '4px 10px' }}
            onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>←</button>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 10px' }}
            onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>→</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aaa', padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayDeliverables = getDeliverablesForDay(day);
            const isToday = isSameDay(new Date(year, month, day), new Date());
            const isSelected = selectedDay === day;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: 52, padding: '4px 6px',
                  borderRadius: 8, cursor: 'pointer',
                  border: `1.5px solid ${isSelected ? '#1D9E75' : isToday ? '#a8dba8' : '#f0f0ee'}`,
                  background: isSelected ? '#E1F5EE' : isToday ? '#f0faf6' : '#fafaf8',
                  transition: 'all 0.12s'
                }}
              >
                <div style={{
                  fontSize: 12, fontWeight: isToday ? 600 : 400,
                  color: isToday ? '#1D9E75' : '#555',
                  marginBottom: 3
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {dayDeliverables.slice(0, 2).map(d => (
                    <div key={d.id} style={{
                      fontSize: 9, padding: '1px 4px', borderRadius: 3,
                      background: PRIORITY_COLORS[d.priority].bg,
                      color: PRIORITY_COLORS[d.priority].text,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      textDecoration: d.done ? 'line-through' : 'none'
                    }}>
                      {d.title}
                    </div>
                  ))}
                  {dayDeliverables.length > 2 && (
                    <div style={{ fontSize: 9, color: '#aaa' }}>+{dayDeliverables.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: '#f9f9f7', borderRadius: 8,
            border: '1px solid #e5e5e2'
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
              {new Date(year, month, selectedDay).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {selectedDayDeliverables.length === 0 ? (
              <div style={{ fontSize: 12, color: '#aaa' }}>Nothing due on this day.</div>
            ) : (
              selectedDayDeliverables.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: PRIORITY_COLORS[d.priority].border
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 500, textDecoration: d.done ? 'line-through' : 'none', color: d.done ? '#aaa' : '#1a1a1a' }}>
                    {d.title}
                  </span>
                  <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto' }}>
                    {new Date(d.deadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Deliverables;