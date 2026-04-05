import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import API from '../utils/api';
import './Notifications.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/notifications').then(r => setNotifications(r.data)).finally(() => setLoading(false));
  }, []);

  const handleClick = async (notif) => {
    // Mark as read
    await API.put(`/notifications/${notif.id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));

    // Redirect based on type
    if (notif.type === 'match' && notif.itemId) {
      navigate(`/items/${notif.itemId}`);
    } else if (notif.type === 'message' && notif.redirectUserId) {
      navigate(`/chat/${notif.redirectUserId}`);
    }
  };

  const markAllRead = async () => {
    await API.put('/notifications/read-all/mark');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type) => {
    if (type === 'match') return '🎯';
    if (type === 'message') return '💬';
    return '🔔';
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="notif-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Notifications</h1>
          <p>{notifications.filter(n => !n.read).length} unread</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button className="btn btn-ghost" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <h3>No notifications yet</h3>
          <p>You'll get notified when AI finds a match for your item or someone messages you</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`notif-item card ${!notif.read ? 'unread' : ''} ${notif.itemId || notif.redirectUserId ? 'clickable' : ''}`}
              onClick={() => handleClick(notif)}
            >
              <div className="notif-icon">{getIcon(notif.type)}</div>
              <div className="notif-content">
                <div className="notif-title">{notif.title}</div>
                <div className="notif-msg">{notif.message}</div>
                <div className="notif-time">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  {(notif.itemId || notif.redirectUserId) && (
                    <span className="notif-cta"> · Click to view →</span>
                  )}
                </div>
              </div>
              {!notif.read && <div className="unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
