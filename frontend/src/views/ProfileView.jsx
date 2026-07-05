import React, { useState, useEffect } from 'react';
import {
    User as UserIcon, BookOpen, GraduationCap, Calendar,
    Plus, X, ArrowLeft, Mail, Award, ShieldCheck, ShieldAlert,
    Edit3, Save
} from 'lucide-react';
import { API_URL } from '../config';

const ProfileView = ({ user, viewProfileId, onBack, onProfileUpdate, setNotification }) => {
    const isOwnProfile = !viewProfileId || viewProfileId === user._id;

    const [profile, setProfile]   = useState(isOwnProfile ? user : null);
    const [loading, setLoading]   = useState(!isOwnProfile);
    const [isEditing, setIsEditing] = useState(false);

    // Edit state
    const [name, setName]         = useState('');
    const [college, setCollege]   = useState('');
    const [branch, setBranch]     = useState('');
    const [bio, setBio]           = useState('');
    const [year, setYear]         = useState('First Year');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills]     = useState([]);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!isOwnProfile) {
            fetchPublicProfile();
        } else {
            setProfile(user);
            setName(user.name || '');
            setCollege(user.college || '');
            setBranch(user.branch || '');
            setBio(user.bio || '');
            setYear(user.year || 'First Year');
            setSkills(user.skills || []);
        }
    }, [viewProfileId, user]);

    const fetchPublicProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/users/${viewProfileId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) setProfile(data);
            else throw new Error(data.message || 'Failed to load user profile');
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = (e) => {
        if (e) e.preventDefault();
        const trimmed = skillInput.trim();
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed]);
            setSkillInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(s => s !== skillToRemove));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ name, college, branch, year, skills, bio }),
            });
            const data = await res.json();
            if (res.ok) {
                const updatedUser = { ...data, token: user.token };
                localStorage.setItem('userInfo', JSON.stringify(updatedUser));
                onProfileUpdate(updatedUser);
                setProfile(updatedUser);
                setIsEditing(false);
                setNotification({ type: 'success', message: 'Profile updated!' });
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setUpdating(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setName(profile.name || '');
        setCollege(profile.college || '');
        setBranch(profile.branch || '');
        setBio(profile.bio || '');
        setYear(profile.year || 'First Year');
        setSkills(profile.skills || []);
    };

    // ── Loading ────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>User not found.</p>
                {onBack && (
                    <button className="btn btn-outline btn-sm" onClick={onBack}>
                        <ArrowLeft size={15} /> Go Back
                    </button>
                )}
            </div>
        );
    }

    const initials = profile.name
        ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div className="profile-container">
            {/* Back button for other user profiles */}
            {onBack && !isOwnProfile && (
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={onBack}
                >
                    <ArrowLeft size={15} /> Back
                </button>
            )}

            {/* Profile header card */}
            <div className="profile-header-card">
                {!isEditing ? (
                    <>
                        <div className="profile-header-top">
                            {/* Avatar */}
                            <div className="profile-avatar profile-avatar-xl">{initials}</div>

                            {/* Info */}
                            <div style={{ flex: 1 }}>
                                <div className="profile-name">
                                    {profile.name}
                                    {profile.isVerified ? (
                                        <span className="verified-badge">
                                            <ShieldCheck size={11} /> Verified
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
                                            <ShieldAlert size={11} /> Unverified
                                        </span>
                                    )}
                                </div>

                                <div className="profile-meta">
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Mail size={13} /> {profile.email}
                                    </span>
                                </div>

                                <div className="profile-meta" style={{ marginTop: '0.4rem' }}>
                                    {profile.college && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <BookOpen size={13} /> {profile.college}
                                        </span>
                                    )}
                                    {profile.branch && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <GraduationCap size={13} /> {profile.branch}
                                        </span>
                                    )}
                                    {profile.year && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Calendar size={13} /> {profile.year}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Edit button (own profile only) */}
                            {isOwnProfile && (
                                <button
                                    id="edit-profile-btn"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setIsEditing(true)}
                                    style={{ flexShrink: 0, alignSelf: 'flex-start' }}
                                >
                                    <Edit3 size={14} /> Edit Profile
                                </button>
                            )}
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <p className="profile-bio">{profile.bio}</p>
                        )}

                        {/* Skills */}
                        <div style={{ marginTop: '1.25rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Award size={15} style={{ color: 'var(--accent)' }} /> Skills &amp; Expertise
                            </div>
                            {!profile.skills || profile.skills.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No skills added yet.</p>
                            ) : (
                                <div className="tag-container">
                                    {profile.skills.map(skill => (
                                        <span key={skill} className="tag" style={{ padding: '0.3rem 0.85rem', fontSize: '0.825rem' }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Edit form */
                    <div>
                        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                            Edit Your Profile
                        </div>

                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="form-input-icon">
                                    <UserIcon size={16} />
                                    <input
                                        id="profile-name"
                                        type="text"
                                        className="form-input"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bio <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                <textarea
                                    id="profile-bio"
                                    className="form-input"
                                    style={{ minHeight: 80, resize: 'vertical' }}
                                    placeholder="Tell others about yourself, your interests, and what you're looking to build…"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">College / University</label>
                                <div className="form-input-icon">
                                    <BookOpen size={16} />
                                    <input
                                        id="profile-college"
                                        type="text"
                                        className="form-input"
                                        value={college}
                                        onChange={e => setCollege(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Branch / Course</label>
                                    <div className="form-input-icon">
                                        <GraduationCap size={16} />
                                        <input
                                            id="profile-branch"
                                            type="text"
                                            className="form-input"
                                            value={branch}
                                            onChange={e => setBranch(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Year of Study</label>
                                    <div className="form-input-icon">
                                        <Calendar size={16} />
                                        <select
                                            id="profile-year"
                                            className="form-input"
                                            value={year}
                                            onChange={e => setYear(e.target.value)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option>First Year</option>
                                            <option>Second Year</option>
                                            <option>Third Year</option>
                                            <option>Fourth Year</option>
                                            <option>Graduate</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Skills &amp; Expertise</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        id="profile-skill-input"
                                        type="text"
                                        className="form-input"
                                        placeholder="Add a skill"
                                        value={skillInput}
                                        onChange={e => setSkillInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSkill(e)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSkill}
                                        className="btn btn-outline btn-icon"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <Plus size={17} />
                                    </button>
                                </div>
                                <div className="tag-container">
                                    {skills.map(skill => (
                                        <span key={skill} className="tag">
                                            {skill}
                                            <span className="tag-remove" onClick={() => handleRemoveSkill(skill)}>
                                                <X size={11} />
                                            </span>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button
                                    id="profile-save-btn"
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={updating}
                                >
                                    {updating ? 'Saving…' : <><Save size={15} /> Save Changes</>}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={cancelEdit}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileView;