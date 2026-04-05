import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import ItemCard from '../components/ItemCard';
import './Home.css';

const CATEGORIES = ['All', 'Electronics', 'Wallet/Purse', 'Keys', 'ID Card', 'Books', 'Clothing', 'Bag', 'Jewellery', 'Other'];

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', category: '', search: '' });

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filter.type) params.type = filter.type;
    if (filter.category && filter.category !== 'All') params.category = filter.category;
    if (filter.search) params.search = filter.search;
    API.get('/items', { params })
      .then(r => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="hero">
        <div className="hero-content">
          <h1>Campus <span className="accent">Lost & Found</span></h1>
          <p>Report lost items or help someone find theirs. AI-powered matching connects you automatically.</p>
          <div className="hero-actions">
            <Link to="/post" className="btn btn-primary">+ Post Item</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat"><span>{items.filter(i => i.type === 'lost').length}</span><label>Lost</label></div>
          <div className="stat"><span>{items.filter(i => i.type === 'found').length}</span><label>Found</label></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text" placeholder="Search items..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="filter-pills">
          {['', 'lost', 'found'].map(t => (
            <button
              key={t}
              className={`pill ${filter.type === t ? 'active' : ''}`}
              onClick={() => setFilter(f => ({ ...f, type: t }))}
            >
              {t === '' ? 'All' : t === 'lost' ? '🔴 Lost' : '🟢 Found'}
            </button>
          ))}
        </div>
        <select
          value={filter.category}
          onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          className="cat-select"
        >
          {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
        </select>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No items found</h3>
          <p>Try adjusting your filters or be the first to post!</p>
          <Link to="/post" className="btn btn-primary" style={{ marginTop: 16 }}>Post an Item</Link>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
