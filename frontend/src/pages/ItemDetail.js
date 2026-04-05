import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './ItemDetail.css';

export default function ItemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    API.get(`/items/${id}`)
      .then(r => setItem(r.data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleResolve = async () => {
    setResolving(true);
    try {
      const res = await API.put(`/items/${id}/resolve`);
      setItem(res.data);
    } finally { setResolving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this item?')) return;
    setDeleting(true);
    try {
      await API.delete(`/items/${id}`);
      navigate('/');
    } finally { setDeleting(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!item) return null;

  const isOwner = user?.id === item.userId;
  const isAdmin = user?.role === 'admin';

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail-grid">
        {/* Image */}
        <div className="detail-image-wrap">
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.title} />
            : <div className="detail-image-placeholder">📦</div>}
        </div>

        {/* Info */}
        <div className="detail-info">
          <div className="detail-badges">
            <span className={`badge badge-${item.type}`}>{item.type}</span>
            {item.status === 'resolved' && <span className="badge badge-resolved">✅ Resolved</span>}
            <span className="badge" style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>{item.category}</span>
          </div>

          <h1>{item.title}</h1>
          <p className="detail-desc">{item.description}</p>

          <div className="detail-meta-grid">
            <div className="meta-item"><span className="meta-label">📍 Location</span><span>{item.location}</span></div>
            <div className="meta-item"><span className="meta-label">🗓 Date</span><span>{item.date}</span></div>
            <div className="meta-item"><span className="meta-label">⏰ Posted</span><span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span></div>
          </div>

          <div className="poster-card">
            <h3>Posted by</h3>
            <p className="poster-name">{item.userName}</p>
            <p className="poster-roll">Roll: {item.userRollNumber}</p>
            {item.contact && <p className="poster-contact">📞 {item.contact}</p>}
          </div>

          <div className="detail-actions">
            {user && !isOwner && (
              <Link to={`/chat/${item.userId}`} className="btn btn-primary">
                💬 Contact {item.userName}
              </Link>
            )}
            {(isOwner || isAdmin) && item.status === 'active' && (
              <button className="btn btn-success" onClick={handleResolve} disabled={resolving}>
                {resolving ? '...' : '✅ Mark Resolved'}
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? '...' : '🗑 Delete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
