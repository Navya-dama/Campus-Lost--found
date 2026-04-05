import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './ItemCard.css';

export default function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className="item-card card">
      <div className="item-image">
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.title} />
          : <div className="item-image-placeholder">📦</div>}
        <span className={`badge badge-${item.type}`}>{item.type}</span>
        {item.status === 'resolved' && <span className="resolved-overlay">✅ Resolved</span>}
      </div>
      <div className="item-body">
        <h3>{item.title}</h3>
        <p className="item-desc">{item.description}</p>
        <div className="item-meta">
          <span>📍 {item.location}</span>
          <span>🗓 {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
        </div>
        <div className="item-footer">
          <span className="category-tag">{item.category}</span>
          <span className="poster-name">by {item.userName}</span>
        </div>
      </div>
    </Link>
  );
}
