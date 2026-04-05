import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import './PostItem.css';

const CATEGORIES = ['Electronics', 'Wallet/Purse', 'Keys', 'ID Card', 'Books', 'Clothing', 'Bag', 'Jewellery', 'Other'];

export default function PostItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', type: 'lost', location: '', date: new Date().toISOString().split('T')[0], contact: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleImage = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (image) data.append('image', image);
      const res = await API.post('/items', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/items/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-page">
      <div className="page-header">
        <h1>Post an Item</h1>
        <p>Report a lost or found item on campus</p>
      </div>

      <div className="post-form card">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="type-toggle">
          {['lost', 'found'].map(t => (
            <button key={t} type="button"
              className={`type-btn ${form.type === t ? 'active-' + t : ''}`}
              onClick={() => setForm(f => ({ ...f, type: t }))}>
              {t === 'lost' ? '🔴 I Lost Something' : '🟢 I Found Something'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Item Title *</label>
              <input type="text" placeholder="e.g. Blue backpack" value={form.title} onChange={set('title')} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea placeholder="Describe the item in detail — color, brand, any identifying marks..." value={form.description} onChange={set('description')} required rows={4} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location *</label>
              <input type="text" placeholder="e.g. Library 2nd floor" value={form.location} onChange={set('location')} required />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={set('date')} />
            </div>
          </div>

          <div className="form-group">
            <label>Contact (phone/email)</label>
            <input type="text" placeholder="How can people reach you?" value={form.contact} onChange={set('contact')} />
          </div>

          <div className="form-group">
            <label>Photo (optional)</label>
            <div className="image-upload" onClick={() => document.getElementById('img-input').click()}>
              {preview
                ? <img src={preview} alt="preview" className="img-preview" />
                : <div className="upload-placeholder"><span>📷</span><p>Click to upload image</p></div>}
            </div>
            <input id="img-input" type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Posting...' : `Post ${form.type === 'lost' ? 'Lost' : 'Found'} Item`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
