import React, { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateTimes() {
  const times = [];
  for (let hour = 8; hour <= 20; hour++) {
    const h = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    const display12 = hour === 12 ? 12 : h;
    times.push(`${display12}:00 ${period}`);
    if (hour < 21) times.push(`${display12}:30 ${period}`);
  }
  return times;
}

const TIMES = generateTimes();

const COLORS = [
  '#f0f0ee', '#d4edd6', '#a8dba8', '#6cc474', '#1D9E75', '#0f6e56', '#085041'
];

function getColor(count, max) {
  if (max === 0 || count === 0) return COLORS[0];
  const index = Math.ceil((count / max) * (COLORS.length - 1));
  return COLORS[Math.min(index, COLORS.length - 1)];
}

function Availability({teamId}) {
  const [members, setMembers] = useState([]);
  const [nameInput, setNameInput] = useState('');
  const [activeMember, setActiveMember] = useState(null);
  const [selections, setSelections] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(`availability-${teamId}`);
    if (saved) {
      const data = JSON.parse(saved);
      setMembers(data.members || []);
      setSelections(data.selections || {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(`availability-${teamId}`, JSON.stringify({ members, selections }));
  }, [members, selections]);

  function addMember() {
    const name = nameInput.trim();
    if (!name || members.includes(name)) return;
    setMembers([...members, name]);
    setSelections(prev => ({ ...prev, [name]: [] }));
    setActiveMember(name);
    setNameInput('');
  }

  function removeMember(name) {
    const newMembers = members.filter(m => m !== name);
    const newSelections = { ...selections };
    delete newSelections[name];
    setMembers(newMembers);
    setSelections(newSelections);
    if (activeMember === name) setActiveMember(newMembers[0] || null);
  }

  function toggleSlot(day, time) {
    if (!activeMember) return;
    const key = `${day}-${time}`;
    const current = selections[activeMember] || [];
    const updated = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    setSelections(prev => ({ ...prev, [activeMember]: updated }));
  }

  function handleMouseDown(day, time) {
    setIsDragging(true);
    toggleSlot(day, time);
  }

  function handleMouseEnter(day, time) {
    if (isDragging) toggleSlot(day, time);
    const slotMembers = getMembersForSlot(day, time);
    setTooltip({ day, time, members: slotMembers });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  function getCountForSlot(day, time) {
    const key = `${day}-${time}`;
    return members.filter(m => (selections[m] || []).includes(key)).length;
  }

  function getMembersForSlot(day, time) {
    const key = `${day}-${time}`;
    return members.filter(m => (selections[m] || []).includes(key));
  }

  function isSelectedByActive(day, time) {
    if (!activeMember) return false;
    const key = `${day}-${time}`;
    return (selections[activeMember] || []).includes(key);
  }

  const maxCount = Math.max(
    1,
    ...DAYS.flatMap(d => TIMES.map(t => getCountForSlot(d, t)))
  );

  const isHourStart = (time) => time.endsWith(':00 AM') || time.endsWith(':00 PM');

  return (
    <div onMouseUp={handleMouseUp} style={{ userSelect: 'none' }}>

      {/* Add member */}
      <div className="card">
        <div className="section-title">Team members</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMember()}
            placeholder="Enter your name..."
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" onClick={addMember}>Add</button>
        </div>

        {members.length === 0 && (
          <p style={{ color: '#999', fontSize: 13 }}>Add team members above, then click your free slots on the grid.</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {members.map(m => (
            <div
              key={m}
              onClick={() => setActiveMember(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 20,
                border: `2px solid ${activeMember === m ? '#1D9E75' : '#e0e0de'}`,
                background: activeMember === m ? '#E1F5EE' : '#fff',
                cursor: 'pointer', fontSize: 13, fontWeight: activeMember === m ? 500 : 400,
                transition: 'all 0.15s'
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: '#1D9E75', color: '#fff',
                fontSize: 11, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {m[0].toUpperCase()}
              </div>
              {m}
              <span
                onClick={e => { e.stopPropagation(); removeMember(m); }}
                style={{ color: '#ccc', marginLeft: 2, fontSize: 15, lineHeight: 1, cursor: 'pointer' }}
              >×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active member prompt */}
      {activeMember && (
        <div style={{
          background: '#E1F5EE', border: '1px solid #a8dba8',
          borderRadius: 8, padding: '8px 14px',
          fontSize: 13, color: '#085041', marginBottom: 12
        }}>
          Editing <strong>{activeMember}</strong>'s availability — click or drag slots below
        </div>
      )}

      {/* Grid */}
      {members.length > 0 && (
        <div className="card" style={{ padding: '1rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 4 }}>

            {/* Time labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 28 }}>
              {TIMES.map(time => (
                <div key={time} style={{
                  height: 18, fontSize: 10, color: isHourStart(time) ? '#555' : '#bbb',
                  display: 'flex', alignItems: 'center',
                  width: 54, justifyContent: 'flex-end', paddingRight: 6,
                  fontWeight: isHourStart(time) ? 500 : 400
                }}>
                  {isHourStart(time) ? time : ''}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map(day => (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 36 }}>
                <div style={{
                  height: 24, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11,
                  fontWeight: 600, color: '#555', marginBottom: 4
                }}>
                  {day}
                </div>
                {TIMES.map(time => {
                  const count = getCountForSlot(day, time);
                  const selected = isSelectedByActive(day, time);
                  const slotColor = getColor(count, maxCount);
                  return (
                    <div
                      key={time}
                      onMouseDown={() => handleMouseDown(day, time)}
                      onMouseEnter={() => handleMouseEnter(day, time)}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        height: 18,
                        background: slotColor,
                        borderRadius: 3,
                        cursor: activeMember ? 'pointer' : 'default',
                        border: selected ? '1.5px solid #0f6e56' : `1px solid ${isHourStart(time) ? '#ddd' : '#eee'}`,
                        transition: 'background 0.1s',
                        position: 'relative'
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {tooltip && tooltip.members.length > 0 && (
            <div style={{
              marginTop: 12, padding: '8px 12px',
              background: '#f9f9f7', borderRadius: 8,
              border: '1px solid #e5e5e2', fontSize: 12
            }}>
              <strong>{tooltip.day} {tooltip.time}</strong>
              <span style={{ color: '#666', marginLeft: 8 }}>
                {tooltip.members.length === members.length
                  ? '✅ Everyone is free!'
                  : `Free: ${tooltip.members.join(', ')}`}
              </span>
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <span style={{ fontSize: 11, color: '#999' }}>0</span>
            {COLORS.map((c, i) => (
              <div key={i} style={{ width: 18, height: 10, background: c, borderRadius: 2 }} />
            ))}
            <span style={{ fontSize: 11, color: '#999' }}>{members.length} members free</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Availability;