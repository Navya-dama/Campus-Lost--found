import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = () => API.get('/notifications/unread-count').then(r => setUnread(r.data.count)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isActive = path => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🎓</span>
          <span>Campus<strong>LostFound</strong></span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={isActive('/') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Home</Link>
          {user && (
            <>
              <Link to="/post" className={isActive('/post') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Post Item</Link>
              <Link to="/my-items" className={isActive('/my-items') ? 'active' : ''} onClick={() => setMenuOpen(false)}>My Items</Link>
              <Link to="/chat" className={isActive('/chat') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Chat</Link>
              <Link to="/notifications" className={`notif-link ${isActive('/notifications') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                🔔 {unread > 0 && <span className="notif-badge">{unread}</span>}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={isActive('/admin') ? 'active' : ''} onClick={() => setMenuOpen(false)}>Admin</Link>
              )}
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
