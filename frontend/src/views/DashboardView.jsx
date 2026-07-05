import React, { useState, useEffect, useRef } from 'react';
import {
    Users, FileText, Send, Check, X, MessageCircle, Sparkles,
    ArrowLeft, LayoutDashboard, Inbox, Trash2, Clock
} from 'lucide-react';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from '../config';

const StatusBadge = ({ status }) => {
    const map = {
        'Open': 'badge-open', 'Requested': 'badge-requested',
        'Team Full': 'badge-full', 'Closed': 'badge-closed',
        'Pending': 'badge-pending', 'Accepted': 'badge-accepted',
        'Rejected': 'badge-rejected', 'Cancelled': 'badge-cancelled', 'Expired': 'badge-cancelled',
    };
    return <span className={`badge ${map[status] || 'badge-closed'}`}>{status}</span>;
};

const Avatar = ({ name, size = 38, fontSize = '0.85rem' }) => {
    const initials = name
        ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';
    return (
        <div className="profile-avatar" style={{ width: size, height: size, fontSize, flexShrink: 0 }}>
            {initials}
        </div>
    );
};

const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const DashboardView = ({ user, onViewProfile, setNotification, onNavigate, defaultTab }) => {
    // 'overview' | 'listings' | 'requests' | 'chat' | 'recommendations' | 'messages'
    const [activeTab, setActiveTab] = useState(defaultTab || 'overview');
    const [listings, setListings]               = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [sentRequests, setSentRequests]         = useState([]);
    const [recommendations, setRecommendations]   = useState([]);
    const [loading, setLoading]                   = useState(true);

    // Chat state
    const [chatListing, setChatListing]   = useState(null);
    const [messages, setMessages]         = useState([]);
    const [chatInput, setChatInput]       = useState('');
    const [chatLoading, setChatLoading]   = useState(false);
    const [sending, setSending]           = useState(false);
    const [requestsSubTab, setRequestsSubTab] = useState('incoming'); // 'incoming' | 'sent'
    const chatEndRef = useRef(null);
    const socketRef  = useRef(null);

    useEffect(() => { fetchDashboardData(); }, []);

    // Update active tab when defaultTab prop changes
    useEffect(() => {
        if (defaultTab) setActiveTab(defaultTab);
    }, [defaultTab]);

    // Chat socket
    useEffect(() => {
        if (activeTab === 'chat' && chatListing) {
            socketRef.current = io(SOCKET_URL);
            socketRef.current.on('connect', () => {
                socketRef.current.emit('join_chat', chatListing._id);
            });
            socketRef.current.on('new_message', (msg) => {
                setMessages(prev => [...prev, msg]);
            });
            return () => {
                if (socketRef.current) {
                    socketRef.current.emit('leave_chat', chatListing._id);
                    socketRef.current.disconnect();
                }
            };
        }
    }, [activeTab, chatListing]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [listingsRes, incomingRes, sentRes] = await Promise.all([
                fetch(`${API_URL}/api/listings`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_URL}/api/requests/incoming`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
                fetch(`${API_URL}/api/requests/sent`, { headers: { 'Authorization': `Bearer ${user.token}` } }),
            ]);
            const [listingsData, incomingData, sentData] = await Promise.all([
                listingsRes.json(), incomingRes.json(), sentRes.json(),
            ]);
            if (listingsRes.ok && incomingRes.ok && sentRes.ok) {
                setListings(listingsData);
                setIncomingRequests(incomingData);
                setSentRequests(sentData);
            } else {
                throw new Error('Failed to load dashboard data');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/listings/recommendations`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) setRecommendations(data);
            else throw new Error(data.message || 'Could not load recommendations');
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const openChat = async (listing) => {
        setChatListing(listing);
        setMessages([]);
        setChatLoading(true);
        setActiveTab('chat');
        try {
            const res = await fetch(`${API_URL}/api/messages/${listing._id}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) setMessages(data);
            else throw new Error(data.message || 'Could not load chat history');
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setChatLoading(false);
        }
    };

    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || sending) return;
        setSending(true);
        try {
            const res = await fetch(`${API_URL}/api/messages/${chatListing._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ text: chatInput.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setChatInput('');
            } else {
                throw new Error(data.message || 'Failed to send message');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setSending(false);
        }
    };

    const handleDecideRequest = async (requestId, action) => {
        try {
            const res = await fetch(`${API_URL}/api/requests/${requestId}/decide`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: `Request ${action.toLowerCase()}ed!` });
                fetchDashboardData();
            } else {
                throw new Error(data.message || 'Failed to decide on request');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            const res = await fetch(`${API_URL}/api/requests/${requestId}/cancel`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: 'Application cancelled.' });
                fetchDashboardData();
            } else {
                throw new Error(data.message || 'Failed to cancel request');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm('Delete this listing? All pending requests will be lost.')) return;
        try {
            const res = await fetch(`${API_URL}/api/listings/${listingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (res.ok) {
                setNotification({ type: 'success', message: 'Listing deleted.' });
                fetchDashboardData();
            } else {
                const data = await res.json();
                throw new Error(data.message || 'Failed to delete listing');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    // Derived data
    const myListings  = listings.filter(l => l.postedBy?._id === user._id || l.postedBy === user._id);
    const joinedTeams = listings.filter(l =>
        l.postedBy?._id !== user._id &&
        l.postedBy !== user._id &&
        l.members?.some(m => m === user._id || m._id === user._id)
    );
    const allMyTeams    = [...myListings, ...joinedTeams];
    const pendingIncoming = incomingRequests.filter(r => r.status === 'Pending').length;
    const pendingSent     = sentRequests.filter(r => r.status === 'Pending').length;

    const Spinner = () => (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <div style={{
                width: 36, height: 36,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
        </div>
    );

    // ─── OVERVIEW tab ──────────────────────────────────────────────────────
    const renderOverview = () => (
        <div>
            {/* Stats row */}
            <div className="stats-row">
                {[
                    { icon: <FileText size={20} />, number: myListings.length, label: 'My Listings', sub: `${myListings.filter(l => l.status === 'Open').length} Open` },
                    { icon: <Send size={20} />, number: sentRequests.length, label: 'Sent Requests', sub: `${pendingSent} Pending` },
                    { icon: <Inbox size={20} />, number: incomingRequests.length, label: 'Incoming Requests', sub: `${pendingIncoming} New` },
                    { icon: <Users size={20} />, number: joinedTeams.length, label: 'Teams Joined', sub: 'Active Collaborations' },
                ].map((stat, i) => (
                    <div className="stat-card" key={i}>
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-info">
                            <div className="stat-number">{stat.number}</div>
                            <div className="stat-label">{stat.label}</div>
                            <div className="stat-sub">{stat.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two-column grid */}
            <div className="dashboard-grid">
                {/* Left column */}
                <div>
                    {/* My Listings */}
                    <div className="dashboard-section">
                        <div className="section-title">
                            My Listings
                            <span className="section-title-link" onClick={() => setActiveTab('listings')}>View All</span>
                        </div>
                        {myListings.length === 0 ? (
                            <div className="empty-state">
                                <FileText size={28} />
                                <span className="empty-state-title">No listings yet</span>
                            </div>
                        ) : (
                            myListings.slice(0, 4).map(l => (
                                <div className="list-item" key={l._id}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                        {l.category === 'Hackathon' ? '⚡' : l.category === 'Startup Idea' ? '🚀' : l.category === 'College Event' ? '🎉' : '📚'}
                                    </div>
                                    <div className="list-item-details">
                                        <div className="list-item-title">{l.title}</div>
                                        <div className="list-item-subtitle">{l.category} · {l.members?.length || 0} members</div>
                                    </div>
                                    <div className="list-item-actions">
                                        <StatusBadge status={l.status} />
                                        {l.members?.length > 0 && (
                                            <button className="btn btn-ghost btn-icon" onClick={() => openChat(l)} title="Open Chat">
                                                <MessageCircle size={15} />
                                            </button>
                                        )}
                                        <button className="btn btn-ghost btn-icon" onClick={() => handleDeleteListing(l._id)} title="Delete listing" style={{ color: '#ef4444' }}>
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Join Requests panel */}
                    <div className="dashboard-section">
                        <div className="section-title">
                            Join Requests
                            <span className="section-title-link" onClick={() => setActiveTab('requests')}>View All</span>
                        </div>
                        <div className="tab-row" style={{ marginBottom: '0.85rem' }}>
                            <button className={`tab-btn ${requestsSubTab === 'incoming' ? 'active' : ''}`} onClick={() => setRequestsSubTab('incoming')}>
                                Incoming ({incomingRequests.length})
                            </button>
                            <button className={`tab-btn ${requestsSubTab === 'sent' ? 'active' : ''}`} onClick={() => setRequestsSubTab('sent')}>
                                Sent ({sentRequests.length})
                            </button>
                        </div>

                        {requestsSubTab === 'incoming' ? (
                            incomingRequests.length === 0 ? (
                                <div className="empty-state"><Inbox size={26} /><span className="empty-state-title">No incoming requests</span></div>
                            ) : (
                                incomingRequests.slice(0, 5).map(req => (
                                    <div className="request-item" key={req._id}>
                                        <Avatar name={req.requestedBy?.name} />
                                        <div className="request-info">
                                            <div className="request-name" style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => onViewProfile(req.requestedBy?._id)}>
                                                {req.requestedBy?.name || 'Unknown'}
                                            </div>
                                            <div className="request-role">{req.requestedBy?.branch || 'Student'}</div>
                                            <div className="request-time">{timeAgo(req.createdAt)}</div>
                                        </div>
                                        <StatusBadge status={req.status} />
                                        {req.status === 'Pending' && (
                                            <div className="request-actions">
                                                <button className="action-btn-accept" onClick={() => handleDecideRequest(req._id, 'accept')} title="Accept">✓</button>
                                                <button className="action-btn-reject" onClick={() => handleDecideRequest(req._id, 'reject')} title="Reject">✕</button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        ) : (
                            sentRequests.length === 0 ? (
                                <div className="empty-state"><Send size={26} /><span className="empty-state-title">No sent requests</span></div>
                            ) : (
                                sentRequests.slice(0, 5).map(req => (
                                    <div className="request-item" key={req._id}>
                                        <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
                                            📌
                                        </div>
                                        <div className="request-info">
                                            <div className="request-name">{req.listingId?.title || 'Unknown Listing'}</div>
                                            <div className="request-role">Applied {timeAgo(req.createdAt)}</div>
                                        </div>
                                        <StatusBadge status={req.status} />
                                        {req.status === 'Pending' && (
                                            <button className="btn btn-outline btn-xs" onClick={() => handleCancelRequest(req._id)}>Cancel</button>
                                        )}
                                    </div>
                                ))
                            )
                        )}
                    </div>

                    {/* Team Chats quick access */}
                    {allMyTeams.length > 0 && (
                        <div className="dashboard-section">
                            <div className="section-title">
                                Team Chats
                                <span className="section-title-link" onClick={() => setActiveTab('chat')}>View All</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {allMyTeams.slice(0, 4).map(l => (
                                    <div
                                        key={l._id}
                                        style={{
                                            background: 'var(--surface)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 12,
                                            padding: '0.9rem',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.2s',
                                        }}
                                        onClick={() => openChat(l)}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                    >
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {l.title}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            <Users size={11} /> {l.members?.length || 0} members
                                            <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontWeight: 500 }}>Open Chat</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div>
                    {/* Recommendations */}
                    <div className="dashboard-section" style={{ marginBottom: '1.25rem' }}>
                        <div className="section-title">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Sparkles size={15} style={{ color: 'var(--accent)' }} /> For You
                            </span>
                            <span className="section-title-link" onClick={() => { setActiveTab('recommendations'); fetchRecommendations(); }}>View All</span>
                        </div>
                        {recommendations.length === 0 ? (
                            <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                                <Sparkles size={24} />
                                <span className="empty-state-title">No recommendations yet</span>
                            </div>
                        ) : (
                            recommendations.slice(0, 4).map(l => (
                                <div className="list-item" key={l._id}>
                                    <div className="list-item-details">
                                        <div className="list-item-title">{l.title}</div>
                                        <div className="list-item-subtitle">{l.category}</div>
                                    </div>
                                    <StatusBadge status={l.status} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // ─── LISTINGS tab ──────────────────────────────────────────────────────
    const renderListings = () => (
        <div>
            <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>My Listings ({myListings.length})</div>
            {myListings.length === 0 ? (
                <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 16, padding: '3rem', background: 'var(--surface-raised)' }}>
                    <FileText size={40} />
                    <div className="empty-state-title">No listings yet</div>
                    <div className="empty-state-desc">Create a listing to find your team.</div>
                </div>
            ) : (
                <div className="listings-grid">
                    {myListings.map(l => (
                        <div key={l._id} className="glass-panel card">
                            <div className="card-header">
                                <span className="card-category">{l.category}</span>
                                <StatusBadge status={l.status} />
                            </div>
                            <h3 className="card-title">{l.title}</h3>
                            <p className="card-desc">{l.description}</p>
                            <div className="card-footer">
                                <div className="slots-label">
                                    <span><Users size={12} /> Team</span>
                                    <span>{l.members?.length || 0} / {Math.max(l.teamSize - 1, 1)}</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div className="progress-bar-fill" style={{ width: `${Math.min(((l.members?.length || 0) / Math.max(l.teamSize - 1, 1)) * 100, 100)}%` }} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {l.members?.length > 0 && (
                                        <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => openChat(l)}>
                                            <MessageCircle size={14} /> Chat
                                        </button>
                                    )}
                                    <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDeleteListing(l._id)}>
                                        <Trash2 size={14} /> Delete
                                    </button>
                                </div>
                                {l.members?.length > 0 && (
                                    <div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Team members:</div>
                                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            {l.members.map(m => (
                                                <div
                                                    key={m._id || m}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                        background: 'var(--surface)', border: '1px solid var(--border)',
                                                        borderRadius: 6, padding: '0.2rem 0.5rem',
                                                        fontSize: '0.78rem', cursor: 'pointer',
                                                        color: 'var(--accent)',
                                                    }}
                                                    onClick={() => onViewProfile(m._id || m)}
                                                >
                                                    <Avatar name={m.name} size={18} fontSize="0.55rem" />
                                                    {m.name || 'Member'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ─── REQUESTS tab ──────────────────────────────────────────────────────
    const renderRequests = () => (
        <div>
            <div className="tab-row" style={{ maxWidth: 360, marginBottom: '1.5rem' }}>
                <button className={`tab-btn ${requestsSubTab === 'incoming' ? 'active' : ''}`} onClick={() => setRequestsSubTab('incoming')}>
                    Incoming ({incomingRequests.length})
                </button>
                <button className={`tab-btn ${requestsSubTab === 'sent' ? 'active' : ''}`} onClick={() => setRequestsSubTab('sent')}>
                    Sent ({sentRequests.length})
                </button>
            </div>

            {requestsSubTab === 'incoming' ? (
                incomingRequests.length === 0 ? (
                    <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 16, padding: '3rem', background: 'var(--surface-raised)' }}>
                        <Inbox size={40} />
                        <div className="empty-state-title">No incoming requests</div>
                        <div className="empty-state-desc">Post a listing to start receiving join requests.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {incomingRequests.map(req => (
                            <div className="request-item" key={req._id} style={{ padding: '1rem 1.25rem' }}>
                                <Avatar name={req.requestedBy?.name} />
                                <div className="request-info">
                                    <div
                                        className="request-name"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => onViewProfile(req.requestedBy?._id)}
                                    >
                                        {req.requestedBy?.name || 'Unknown'}
                                    </div>
                                    <div className="request-role">
                                        {req.requestedBy?.branch || 'Student'} · {req.listingId?.title || 'Listing'}
                                    </div>
                                    <div className="request-time"><Clock size={10} /> {timeAgo(req.createdAt)}</div>
                                </div>
                                <StatusBadge status={req.status} />
                                {req.status === 'Pending' && (
                                    <div className="request-actions">
                                        <button className="action-btn-accept" onClick={() => handleDecideRequest(req._id, 'accept')} title="Accept">✓</button>
                                        <button className="action-btn-reject" onClick={() => handleDecideRequest(req._id, 'reject')} title="Reject">✕</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                sentRequests.length === 0 ? (
                    <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 16, padding: '3rem', background: 'var(--surface-raised)' }}>
                        <Send size={40} />
                        <div className="empty-state-title">No sent requests</div>
                        <div className="empty-state-desc">Browse listings and send a join request.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {sentRequests.map(req => (
                            <div className="request-item" key={req._id} style={{ padding: '1rem 1.25rem' }}>
                                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                                    📌
                                </div>
                                <div className="request-info">
                                    <div className="request-name">{req.listingId?.title || 'Unknown Listing'}</div>
                                    <div className="request-role">{req.listingId?.category || ''}</div>
                                    <div className="request-time"><Clock size={10} /> {timeAgo(req.createdAt)}</div>
                                </div>
                                <StatusBadge status={req.status} />
                                {req.status === 'Pending' && (
                                    <button className="btn btn-outline btn-xs" onClick={() => handleCancelRequest(req._id)}>Cancel</button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );

    // ─── CHAT tab ──────────────────────────────────────────────────────────
    const renderChat = () => {
        if (!chatListing) {
            return (
                <div>
                    <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                        Team Chats ({allMyTeams.length})
                    </div>
                    {allMyTeams.length === 0 ? (
                        <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 16, padding: '3rem', background: 'var(--surface-raised)' }}>
                            <MessageCircle size={40} />
                            <div className="empty-state-title">No team chats yet</div>
                            <div className="empty-state-desc">Join a team or create a listing to start chatting.</div>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                            {allMyTeams.map(l => (
                                <div
                                    key={l._id}
                                    style={{
                                        background: 'var(--surface-raised)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 14,
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onClick={() => openChat(l)}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{l.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Users size={12} /> {l.members?.length || 0} members
                                    </div>
                                    <button className="btn btn-primary btn-sm w-full">
                                        <MessageCircle size={14} /> Open Chat
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div>
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => { setChatListing(null); }}
                >
                    <ArrowLeft size={15} /> Back to chats
                </button>

                <div className="chat-container">
                    <div className="chat-header">
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{chatListing.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{chatListing.members?.length || 0} members</div>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {chatLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                                <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="empty-state">
                                <MessageCircle size={28} />
                                <span className="empty-state-title">No messages yet</span>
                                <span className="empty-state-desc">Start the conversation!</span>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMine = msg.sender?._id === user._id || msg.sender === user._id;
                                return (
                                    <div key={msg._id || i}>
                                        {!isMine && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem', marginLeft: '0.5rem' }}>
                                                {msg.sender?.name || 'Member'}
                                            </div>
                                        )}
                                        <div className={`chat-message ${isMine ? 'mine' : 'theirs'}`}>
                                            {msg.text}
                                            <div className="chat-message-meta" style={{ color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={sendChatMessage} className="chat-input-row">
                        <textarea
                            className="form-input chat-input"
                            placeholder="Type a message…"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendChatMessage(e);
                                }
                            }}
                            rows={1}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={sending || !chatInput.trim()}
                            style={{ flexShrink: 0 }}
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    // ─── RECOMMENDATIONS tab ───────────────────────────────────────────────
    const renderRecommendations = () => (
        <div>
            <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={18} style={{ color: 'var(--accent)' }} /> Recommended for You
                </span>
            </div>
            {recommendations.length === 0 ? (
                <div className="empty-state" style={{ border: '1px solid var(--border)', borderRadius: 16, padding: '3rem', background: 'var(--surface-raised)' }}>
                    <Sparkles size={40} />
                    <div className="empty-state-title">No recommendations yet</div>
                    <div className="empty-state-desc">Add more skills to your profile to get personalized suggestions.</div>
                </div>
            ) : (
                <div className="listings-grid">
                    {recommendations.map(l => (
                        <div key={l._id} className="glass-panel card">
                            <div className="card-header">
                                <span className="card-category">{l.category}</span>
                                <StatusBadge status={l.status} />
                            </div>
                            <h3 className="card-title">{l.title}</h3>
                            <p className="card-desc">{l.description}</p>
                            <div className="card-footer">
                                <div className="tag-container">
                                    {l.skillsNeeded?.slice(0, 4).map(s => (
                                        <span key={s} className="tag tag-secondary">{s}</span>
                                    ))}
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    By: <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => onViewProfile(l.postedBy?._id)}>{l.postedBy?.name}</span>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            {loading ? (
                <Spinner />
            ) : (
                <>
                    {activeTab === 'overview'         && renderOverview()}
                    {activeTab === 'listings'         && renderListings()}
                    {(activeTab === 'requests' || activeTab === 'messages') && renderRequests()}
                    {activeTab === 'chat'             && renderChat()}
                    {activeTab === 'recommendations'  && renderRecommendations()}
                </>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default DashboardView;