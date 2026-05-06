import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Availability from './Availability';
import Deliverables from './Deliverables';
import Tasks from './Tasks';
import './index.css';

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

function Shell() {
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('availability');
  const [newTeamName, setNewTeamName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { teamId } = useParams();

  useEffect(() => {
    const saved = localStorage.getItem('teams');
    if (saved) setTeams(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  const activeTeam = teams.find(t => t.id === teamId) || null;

  function createTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    const id = generateId();
    const newTeam = { id, name };
    const updated = [...teams, newTeam];
    setTeams(updated);
    setNewTeamName('');
    setShowInput(false);
    navigate(`/team/${id}`);
  }

  function deleteTeam(id) {
    const updated = teams.filter(t => t.id !== id);
    setTeams(updated);
    localStorage.removeItem(`availability-${id}`);
    localStorage.removeItem(`deliverables-${id}`);
    localStorage.removeItem(`tasks-${id}`);
    if (teamId === id) navigate('/');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="layout">

      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="topbar-logo">G</div>
          <span className="topbar-title">GroupHub</span>
        </div>

        <div className="sidebar-section-label">Your Teams</div>

        <div className="team-list">
          {teams.map(t => (
            <div
              key={t.id}
              className={`team-item ${teamId === t.id ? 'active' : ''}`}
              onClick={() => navigate(`/team/${t.id}`)}
            >
              <div className="team-item-avatar">{t.name[0].toUpperCase()}</div>
              <span className="team-item-name">{t.name}</span>
              <span
                className="team-item-delete"
                onClick={e => { e.stopPropagation(); deleteTeam(t.id); }}
              >×</span>
            </div>
          ))}
        </div>

        {showInput ? (
          <div style={{ padding: '0 12px', marginTop: 8 }}>
            <input
              autoFocus
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTeam()}
              placeholder="Team name..."
              style={{ width: '100%', marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={createTeam}>Create</button>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowInput(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn-new-team" onClick={() => setShowInput(true)}>
            + New Team
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="main">
        {!activeTeam ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h2>No team selected</h2>
            <p>Create a new team from the sidebar to get started.</p>
          </div>
        ) : (
          <>
            {/* Team header */}
            <div className="team-header">
              <div>
                <div className="team-header-name">{activeTeam.name}</div>
                <div className="team-header-id">Team ID: {activeTeam.id}</div>
              </div>
              <button className="btn btn-ghost" onClick={copyLink} style={{ fontSize: 12 }}>
                {copied ? '✅ Copied!' : '🔗 Copy invite link'}
              </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => setActiveTab('availability')}>Availability</button>
              <button className={`tab ${activeTab === 'deliverables' ? 'active' : ''}`} onClick={() => setActiveTab('deliverables')}>Deliverables</button>
              <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks</button>
            </div>

            {/* Tab content */}
            <div className="tab-content">
              {activeTab === 'availability' && <Availability teamId={activeTeam.id} />}
              {activeTab === 'deliverables' && <Deliverables teamId={activeTeam.id} />}
              {activeTab === 'tasks' && <Tasks teamId={activeTeam.id} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />} />
        <Route path="/team/:teamId" element={<Shell />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;