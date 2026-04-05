import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './Chat.css';

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    API.get('/chat/conversations').then(r => setConversations(r.data)).catch(() => {});
  }, [userId]);

  // Load messages for selected user
  useEffect(() => {
    if (!userId) return;
    API.get(`/chat/${userId}`).then(r => {
      setMessages(r.data);
      if (r.data.length > 0) {
        const other = r.data.find(m => m.senderId !== user.id);
        if (other) setOtherUser({ id: other.senderId, name: other.senderName });
      }
    }).catch(() => {});
  }, [userId, user.id]);

  // Auto scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(() => {
      API.get(`/chat/${userId}`).then(r => setMessages(r.data)).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !userId) return;
    setSending(true);
    try {
      const res = await API.post(`/chat/${userId}`, { text });
      setMessages(prev => [...prev, res.data]);
      setText('');
      API.get('/chat/conversations').then(r => setConversations(r.data));
    } finally { setSending(false); }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header"><h2>Messages</h2></div>
        {conversations.length === 0 && (
          <div className="chat-empty-sidebar"><p>No conversations yet</p></div>
        )}
        {conversations.map(conv => (
          <div key={conv.key}
            className={`conv-item ${conv.user?.id === userId ? 'active' : ''}`}
            onClick={() => { navigate(`/chat/${conv.user?.id}`); setOtherUser(conv.user); }}>
            <div className="conv-avatar">{conv.user?.name?.[0]?.toUpperCase() || '?'}</div>
            <div className="conv-info">
              <div className="conv-name">{conv.user?.name || 'Unknown'}</div>
              <div className="conv-last">{conv.lastMessage.text.substring(0, 35)}...</div>
            </div>
            {conv.unread > 0 && <span className="conv-unread">{conv.unread}</span>}
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {!userId ? (
          <div className="chat-start"><p>💬 Select a conversation or start one from an item page</p></div>
        ) : (
          <>
            <div className="chat-header">
              <div className="conv-avatar">{(otherUser?.name || '?')[0].toUpperCase()}</div>
              <div>
                <div className="chat-name">{otherUser?.name || 'User'}</div>
                <div className="chat-status">Active</div>
              </div>
            </div>

            <div className="messages-area">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.senderId === user.id ? 'mine' : 'theirs'}`}>
                  <div className="msg-bubble">{msg.text}</div>
                  <div className="msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
              <input
                type="text" placeholder="Type a message..."
                value={text} onChange={e => setText(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary send-btn" disabled={sending || !text.trim()}>
                {sending ? '...' : '➤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
