import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import API from '../utils/api';
import './AdminPanel.css';

export default function AdminPanel() {
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/users'),
      API.get('/admin/items')
    ]).then(([s, u, i]) => {
      setStats(s.data); setUsers(u.data); setItems(i.data);
    }).finally(() => setLoading(false));
  }, []);

  const deleteItem = async (id) => {
    if (!window.confirm('Delete?')) return;
    await API.delete(`/admin/items/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
    setStats(s => ({ ...s, totalItems: s.totalItems - 1 }));
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete user and their data?')) return;
    await API.delete(`/admin/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>🛡 Admin Panel</h1>
        <p>Manage campus Lost & Found</p>
      </div>

      <div className="admin-tabs">
        {['stats', 'items', 'users'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'stats' ? '📊 Stats' : t === 'items' ? '📦 Items' : '👥 Users'}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card card"><div className="stat-num">{stats.totalUsers}</div><div className="stat-lbl">Students</div></div>
          <div className="stat-card card"><div className="stat-num" style={{ color: 'var(--lost)' }}>{stats.lostItems}</div><div className="stat-lbl">Active Lost</div></div>
          <div className="stat-card card"><div className="stat-num" style={{ color: 'var(--found)' }}>{stats.foundItems}</div><div className="stat-lbl">Active Found</div></div>
          <div className="stat-card card"><div className="stat-num" style={{ color: 'var(--text2)' }}>{stats.resolvedItems}</div><div className="stat-lbl">Resolved</div></div>
          <div className="stat-card card"><div className="stat-num">{stats.totalMessages}</div><div className="stat-lbl">Messages Sent</div></div>
        </div>
      )}

      {/* Items */}
      {tab === 'items' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Item</th><th>Type</th><th>Posted by</th><th>Location</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><Link to={`/items/${item.id}`}>{item.title}</Link></td>
                  <td><span className={`badge badge-${item.type}`}>{item.type}</span></td>
                  <td>{item.userName}<br/><small style={{ color: 'var(--text2)' }}>{item.userRollNumber}</small></td>
                  <td>{item.location}</td>
                  <td><span className={`badge badge-${item.status === 'resolved' ? 'resolved' : item.type}`}>{item.status}</span></td>
                  <td><button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => deleteItem(item.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Roll No</th><th>Posts</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.filter(u => u.role !== 'admin').map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.rollNumber}</td>
                  <td>{u.itemsCount}</td>
                  <td>{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</td>
                  <td><button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => deleteUser(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
