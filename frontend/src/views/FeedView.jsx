import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Calendar, Users, X, Sparkles,
    FolderOpen, Filter
} from 'lucide-react';
import { API_URL } from '../config';

const CATEGORY_EMOJI = {
    'Hackathon':      '⚡',
    'College Project':'📚',
    'Startup Idea':   '🚀',
    'College Event':  '🎉',
};

const StatusBadge = ({ status }) => {
    const cls = {
        'Open':      'badge-open',
        'Requested': 'badge-requested',
        'Team Full': 'badge-full',
        'Closed':    'badge-closed',
    }[status] || 'badge-closed';
    return <span className={`badge ${cls}`}>{status}</span>;
};

const FeedView = ({ user, onViewProfile, setNotification }) => {
    const [listings, setListings]               = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading]                 = useState(true);
    const [category, setCategory]               = useState('All');
    const [skillQuery, setSkillQuery]           = useState('');
    const [searchQuery, setSearchQuery]         = useState('');
    const [sentRequestListings, setSentRequestListings] = useState([]);

    // Create Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle]           = useState('');
    const [description, setDescription] = useState('');
    const [listCategory, setListCategory] = useState('Hackathon');
    const [skillsNeeded, setSkillsNeeded] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [teamSize, setTeamSize]     = useState(3);
    const [deadline, setDeadline]     = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchListings();
        fetchMyRequests();
        fetchRecommendations();
    }, [category]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            let url = `${API_URL}/api/listings?category=${category}`;
            if (skillQuery.trim()) url += `&skill=${encodeURIComponent(skillQuery.trim())}`;
            if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery.trim())}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) setListings(data);
            else throw new Error(data.message || 'Failed to fetch listings');
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const res = await fetch(`${API_URL}/api/listings/recommendations`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) setRecommendations(data.slice(0, 3));
        } catch (err) {
            console.error('Error fetching recommendations:', err);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const res = await fetch(`${API_URL}/api/requests/sent`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) {
                const requestedIds = data
                    .filter(req => ['Pending', 'Accepted'].includes(req.status))
                    .map(req => req.listingId?._id || req.listingId);
                setSentRequestListings(requestedIds);
            }
        } catch (err) {
            console.error('Error fetching sent requests mapping:', err);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchListings();
    };

    const handleAddSkillTag = (e) => {
        if (e) e.preventDefault();
        const trimmed = skillInput.trim();
        if (trimmed && !skillsNeeded.includes(trimmed)) {
            setSkillsNeeded([...skillsNeeded, trimmed]);
            setSkillInput('');
        }
    };

    const handleRemoveSkillTag = (skill) => {
        setSkillsNeeded(skillsNeeded.filter(s => s !== skill));
    };

    const handleCreateListing = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_URL}/api/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    title,
                    description,
                    category: listCategory,
                    skillsNeeded,
                    teamSize: parseInt(teamSize),
                    deadline,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setListings([data, ...listings]);
                setShowCreateModal(false);
                setNotification({ type: 'success', message: 'Project listing created!' });
                setTitle(''); setDescription(''); setSkillsNeeded([]); setTeamSize(3); setDeadline('');
            } else {
                throw new Error(data.message || 'Failed to create listing');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestJoin = async (listingId) => {
        try {
            const res = await fetch(`${API_URL}/api/requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ listingId }),
            });
            const data = await res.json();
            if (res.ok) {
                setNotification({ type: 'success', message: 'Join request sent!' });
                setSentRequestListings([...sentRequestListings, listingId]);
                setListings(listings.map(l =>
                    l._id === listingId ? { ...l, status: 'Requested' } : l
                ));
            } else {
                throw new Error(data.message || 'Failed to send join request');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        }
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const renderActionBtn = (listing) => {
        const isOwner          = listing.postedBy?._id === user._id;
        const isAlreadyMember  = listing.members?.some(m => m === user._id || m._id === user._id);
        const isAlreadyRequested = sentRequestListings.includes(listing._id);
        const isClosed         = listing.status === 'Team Full' || listing.status === 'Closed';

        if (isOwner) {
            return <button className="btn btn-outline btn-sm w-full" disabled>Your Listing</button>;
        }
        if (isAlreadyMember) {
            return <button className="btn btn-sm w-full" style={{ background: 'var(--status-accepted)', color: 'white' }} disabled>✓ Team Member</button>;
        }
        if (isAlreadyRequested) {
            return <button className="btn btn-sm w-full" style={{ background: 'var(--status-requested-bg)', color: 'var(--status-requested)', border: '1px solid var(--status-requested-border)' }} disabled>Request Pending</button>;
        }
        if (isClosed) {
            return <button className="btn btn-outline btn-sm w-full" disabled>Team Full / Closed</button>;
        }
        return (
            <button
                className="btn btn-primary btn-sm w-full"
                onClick={() => handleRequestJoin(listing._id)}
            >
                Request to Join
            </button>
        );
    };

    return (
        <div>
            {/* Header */}
            <div className="view-header">
                <div>
                    <h1 className="view-title">Explore Projects</h1>
                    <p className="view-subtitle">Discover projects and team up with fellow students.</p>
                </div>
                <button
                    id="create-listing-btn"
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={17} /> Create Listing
                </button>
            </div>

            {/* Recommendations strip */}
            {recommendations.length > 0 && (
                <div style={{ marginBottom: '1.75rem' }}>
                    <div className="section-title">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                            Recommended for You
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
                        {recommendations.map(listing => (
                            <div
                                key={listing._id}
                                style={{
                                    background: 'var(--surface-raised)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'border-color 0.2s',
                                    cursor: 'default',
                                }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10,
                                    background: 'var(--accent-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem', flexShrink: 0,
                                }}>
                                    {CATEGORY_EMOJI[listing.category] || '📌'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {listing.title}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                        {listing.category}
                                    </div>
                                </div>
                                <StatusBadge status={listing.status} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter bar */}
            <form onSubmit={handleSearchSubmit} className="filters-bar">
                <div className="search-input-container">
                    <Search size={16} />
                    <input
                        id="explore-search"
                        type="text"
                        className="form-input search-input"
                        placeholder="Search projects or titles…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Filter size={14} style={{ position: 'absolute', left: '0.9rem', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                        id="explore-skill-filter"
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.3rem', width: '180px' }}
                        placeholder="Filter by skill…"
                        value={skillQuery}
                        onChange={(e) => setSkillQuery(e.target.value)}
                    />
                </div>

                <select
                    id="explore-category-filter"
                    className="filter-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    <option value="Hackathon">Hackathons</option>
                    <option value="College Project">College Projects</option>
                    <option value="Startup Idea">Startup Ideas</option>
                    <option value="College Event">College Events</option>
                </select>

                <button id="explore-search-btn" type="submit" className="btn btn-primary btn-sm">Search</button>
            </form>

            {/* Listings grid */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                    <div style={{
                        width: 36, height: 36,
                        border: '3px solid var(--border)',
                        borderTopColor: 'var(--accent)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                </div>
            ) : listings.length === 0 ? (
                <div className="empty-state" style={{ marginTop: '2rem', border: '1px solid var(--border)', borderRadius: 16, background: 'var(--surface-raised)', padding: '3rem' }}>
                    <FolderOpen size={40} />
                    <div className="empty-state-title">No listings found</div>
                    <div className="empty-state-desc">Try adjusting your filters or be the first to create a listing!</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                        <Plus size={15} /> Create Listing
                    </button>
                </div>
            ) : (
                <div className="listings-grid">
                    {listings.map((listing) => {
                        const slotsFilled  = listing.members?.length || 0;
                        const slotsRequired = Math.max(listing.teamSize - 1, 1);
                        const progressPct  = Math.min((slotsFilled / slotsRequired) * 100, 100);

                        return (
                            <div key={listing._id} className="glass-panel card">
                                <div className="card-header">
                                    <span className="card-category">
                                        {CATEGORY_EMOJI[listing.category]} {listing.category}
                                    </span>
                                    <StatusBadge status={listing.status} />
                                </div>

                                <h3 className="card-title">{listing.title}</h3>
                                <p className="card-desc">{listing.description}</p>

                                {listing.skillsNeeded?.length > 0 && (
                                    <div className="tag-container" style={{ marginBottom: '0.85rem' }}>
                                        {listing.skillsNeeded.slice(0, 5).map(skill => (
                                            <span key={skill} className="tag tag-secondary">{skill}</span>
                                        ))}
                                        {listing.skillsNeeded.length > 5 && (
                                            <span className="tag tag-secondary">+{listing.skillsNeeded.length - 5}</span>
                                        )}
                                    </div>
                                )}

                                <div className="card-footer">
                                    {/* Slots progress */}
                                    <div>
                                        <div className="slots-label">
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Users size={12} /> Team slots
                                            </span>
                                            <span>{slotsFilled} / {slotsRequired}</span>
                                        </div>
                                        <div className="progress-bar-bg">
                                            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                                        </div>
                                    </div>

                                    <div className="card-meta">
                                        <span
                                            style={{ cursor: 'pointer', color: 'var(--accent)', fontWeight: 600 }}
                                            onClick={() => onViewProfile(listing.postedBy?._id)}
                                        >
                                            {listing.postedBy?.name || 'Unknown'}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={11} />
                                            {listing.deadline ? formatDate(listing.deadline) : 'No deadline'}
                                        </span>
                                    </div>

                                    {renderActionBtn(listing)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Listing Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">Create Project Listing</span>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateListing}>
                            <div className="form-group">
                                <label className="form-label">Project / Event Title</label>
                                <input
                                    id="modal-title"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Smart India Hackathon — FinTech App"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description &amp; Goals</label>
                                <textarea
                                    id="modal-description"
                                    className="form-input"
                                    style={{ minHeight: 90, resize: 'vertical' }}
                                    placeholder="Outline your project scope, target tech stack, and what you plan to build…"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        id="modal-category"
                                        className="form-input"
                                        value={listCategory}
                                        onChange={e => setListCategory(e.target.value)}
                                    >
                                        <option>Hackathon</option>
                                        <option>College Project</option>
                                        <option>Startup Idea</option>
                                        <option>College Event</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Team Size (incl. you)</label>
                                    <input
                                        id="modal-teamsize"
                                        type="number"
                                        className="form-input"
                                        min="2" max="10"
                                        value={teamSize}
                                        onChange={e => setTeamSize(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Application Deadline</label>
                                <input
                                    id="modal-deadline"
                                    type="date"
                                    className="form-input"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Skills Needed</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        id="modal-skill-input"
                                        type="text"
                                        className="form-input"
                                        placeholder="Add a required skill"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSkillTag(e)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSkillTag}
                                        className="btn btn-outline btn-icon"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <Plus size={17} />
                                    </button>
                                </div>
                                <div className="tag-container">
                                    {skillsNeeded.map(skill => (
                                        <span key={skill} className="tag">
                                            {skill}
                                            <span className="tag-remove" onClick={() => handleRemoveSkillTag(skill)}>
                                                <X size={11} />
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button id="modal-submit-btn" type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Creating…' : 'Post Listing'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default FeedView;