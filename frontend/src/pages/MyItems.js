import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import API from '../utils/api';
import './MyItems.css';

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/items/user/my').then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id) => {
    const res = await API.put(`/items/${id}/resolve`);
    setItems(prev => prev.map(i => i.id === id ? res.data : i));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    await API.delete(`/items/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="myitems-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>My Items</h1><p>Items you've posted</p></div>
        <Link to="/post" className="btn btn-primary">+ Post New</Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No items yet</h3>
          <p>Post your first lost or found item</p>
          <Link to="/post" className="btn btn-primary" style={{ marginTop: 16 }}>Post Item</Link>
        </div>
      ) : (
        <div className="myitems-list">
          {items.map(item => (
            <div key={item.id} className="myitem-row card">
              <div className="myitem-image">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt={item.title} />
                  : <div className="myitem-placeholder">📦</div>}
              </div>
              <div className="myitem-info">
                <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <span className={`badge badge-${item.type}`}>{item.type}</span>
                  {item.status === 'resolved' && <span className="badge badge-resolved">✅ Resolved</span>}
                </div>
                <h3><Link to={`/items/${item.id}`}>{item.title}</Link></h3>
                <p>📍 {item.location} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
              </div>
              <div className="myitem-actions">
                {item.status === 'active' && (
                  <button className="btn btn-success" onClick={() => handleResolve(item.id)}>✅ Resolved</button>
                )}
                <button className="btn btn-danger" onClick={() => handleDelete(item.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
