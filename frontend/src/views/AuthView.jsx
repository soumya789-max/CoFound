import React, { useState } from 'react';
import {
    Mail, Lock, User as UserIcon, BookOpen,
    GraduationCap, Calendar, Plus, X, Trophy, Sun, Moon, Eye, EyeOff
} from 'lucide-react';
import { API_URL } from '../config';
import logoDark from '../assets/logo-dark.svg';
import logoLight from '../assets/logo-light.svg';

const AuthView = ({ onAuthSuccess, setNotification, onBackToLanding, theme, onThemeToggle }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [college, setCollege] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('First Year');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const endpoint = isLogin
            ? `${API_URL}/api/auth/login`
            : `${API_URL}/api/auth/register`;

        const payload = isLogin
            ? { email, password }
            : { name, email, password, college, branch, year, skills };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            localStorage.setItem('userInfo', JSON.stringify(data));
            onAuthSuccess(data);
            setNotification({
                type: 'success',
                message: isLogin ? 'Welcome back!' : 'Account created successfully!',
            });
        } catch (err) {
            setNotification({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Navbar */}
                <div className="auth-nav">
                    <div
                        className="auth-logo"
                        onClick={onBackToLanding}
                        title="Back to home"
                    >
                        <img
                            src={theme === 'dark' ? logoDark : logoLight}
                            alt="CoFound"
                            style={{ height: 36 }}
                        />
                    </div>

                    <button
                        className="theme-toggle"
                        onClick={onThemeToggle}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                    </button>
                </div>

                {/* Card */}
                <div className="auth-card">
                    {/* Heading */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h1 style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '1.6rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: '0.3rem',
                        }}>
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {isLogin
                                ? 'Find your teammates. Build something real.'
                                : 'Create your verified student profile.'}
                        </p>
                    </div>

                    {/* Tab toggle */}
                    <div className="auth-tabs">
                        <button
                            id="auth-login-tab"
                            className={`auth-tab ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                            type="button"
                        >
                            Log In
                        </button>
                        <button
                            id="auth-register-tab"
                            className={`auth-tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                            type="button"
                        >
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Name — register only */}
                        {!isLogin && (
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="form-input-icon">
                                    <UserIcon size={16} />
                                    <input
                                        id="reg-name"
                                        type="text"
                                        className="form-input"
                                        placeholder="Soumya Sharma"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">College Email Address</label>
                            <div className="form-input-icon">
                                <Mail size={16} />
                                <input
                                    id="auth-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="name@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="form-input-icon" style={{ position: 'relative' }}>
                                <Lock size={16} />
                                <input
                                    id="auth-password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.9rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: 0,
                                    }}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Register-only fields */}
                        {!isLogin && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">College / University</label>
                                    <div className="form-input-icon">
                                        <BookOpen size={16} />
                                        <input
                                            id="reg-college"
                                            type="text"
                                            className="form-input"
                                            placeholder="Parul University"
                                            value={college}
                                            onChange={(e) => setCollege(e.target.value)}
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
                                                id="reg-branch"
                                                type="text"
                                                className="form-input"
                                                placeholder="B.Tech CSE"
                                                value={branch}
                                                onChange={(e) => setBranch(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Year of Study</label>
                                        <div className="form-input-icon">
                                            <Calendar size={16} />
                                            <select
                                                id="reg-year"
                                                className="form-input"
                                                value={year}
                                                onChange={(e) => setYear(e.target.value)}
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
                                    <label className="form-label">Skills <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            id="reg-skill-input"
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g. React, Node, Python"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAddSkill(e);
                                            }}
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
                                    {skills.length > 0 && (
                                        <div className="tag-container">
                                            {skills.map(skill => (
                                                <span key={skill} className="tag">
                                                    {skill}
                                                    <span
                                                        className="tag-remove"
                                                        onClick={() => handleRemoveSkill(skill)}
                                                        role="button"
                                                        aria-label={`Remove ${skill}`}
                                                    >
                                                        <X size={11} />
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <button
                            id="auth-submit-btn"
                            type="submit"
                            className="btn btn-primary w-full"
                            style={{ marginTop: '0.75rem' }}
                            disabled={loading}
                        >
                            {loading
                                ? 'Processing…'
                                : isLogin
                                    ? 'Sign In'
                                    : 'Create Account'}
                        </button>
                    </form>

                    {/* Switch mode */}
                    <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--accent)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                padding: 0,
                                fontFamily: 'Inter, sans-serif',
                            }}
                        >
                            {isLogin ? 'Register' : 'Sign In'}
                        </button>
                    </p>
                </div>

                {/* Back to landing */}
                {onBackToLanding && (
                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <button
                            type="button"
                            onClick={onBackToLanding}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: 'Inter, sans-serif',
                                textDecoration: 'underline',
                            }}
                        >
                            ← Back to home
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
};

export default AuthView;
