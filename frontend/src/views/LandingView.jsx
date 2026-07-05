import React from 'react';
import {
    Trophy, Search, Send, MessageSquare, Bell, ShieldCheck,
    ArrowRight, Users, Sun, Moon, CheckCircle, Star, Zap
} from 'lucide-react';
import logoDark from '../assets/logo-dark.svg';
import logoLight from '../assets/logo-light.svg';

const FEATURES = [
    {
        icon: <Search size={20} />,
        title: 'Discover by Category',
        desc: 'Browse project listings across multiple categories and find opportunities that match your skills and interests.',
    },
    {
        icon: <Send size={20} />,
        title: 'Join & Manage Requests',
        desc: 'Send join requests to projects, track their status, and manage incoming requests with ease.',
    },
    {
        icon: <MessageSquare size={20} />,
        title: 'Real-time Team Chat',
        desc: 'Chat in real-time with your team, share ideas, files, and stay aligned throughout the journey.',
    },
    {
        icon: <Bell size={20} />,
        title: 'Smart Notifications',
        desc: 'Stay updated with important alerts about requests, team updates, and project activities.',
    },
    {
        icon: <ShieldCheck size={20} />,
        title: 'Verified Student Profiles',
        desc: 'Connect with real students from verified colleges and build trust in every collaboration.',
    },
];

const DEMO_LISTINGS = [
    { emoji: '🤖', name: 'AI Study Companion', tags: 'ML · Web App', badge: 'Open', badgeClass: 'badge-open' },
    { emoji: '🍔', name: 'Campus Food Connect', tags: 'Mobile App · Backend', badge: 'Requested', badgeClass: 'badge-requested' },
    { emoji: '🌍', name: 'Eventify', tags: 'Web App · Design', badge: 'Team Full', badgeClass: 'badge-full' },
];

const LandingView = ({ onGetStarted, onLogin, theme, onThemeToggle }) => {
    return (
        <div className="landing-page">
            {/* ── Navbar ─────────────────────────────────────────── */}
            <nav className="landing-nav">
                <div className="landing-nav-logo">
                    <img
                        src={theme === 'dark' ? logoDark : logoLight}
                        alt="CoFound"
                        style={{ height: 32 }}
                    />
                </div>

                <div className="landing-nav-links">
                    <a href="#features" className="landing-nav-link">Features</a>
                    <a href="#how-it-works" className="landing-nav-link">How it Works</a>
                    <a href="#features" className="landing-nav-link">For Students</a>
                    <a href="#testimonials" className="landing-nav-link">Testimonials</a>
                    <a href="#faq" className="landing-nav-link">FAQ</a>
                </div>

                <div className="landing-nav-actions">
                    <button
                        className="theme-toggle"
                        onClick={onThemeToggle}
                        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        aria-label="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    <button
                        id="landing-login-btn"
                        className="btn btn-outline btn-sm"
                        onClick={onLogin}
                    >
                        Log In
                    </button>

                    <button
                        id="landing-get-started-btn"
                        className="btn btn-primary btn-sm"
                        onClick={onGetStarted}
                        style={{ gap: '0.4rem' }}
                    >
                        Get Started <ArrowRight size={15} />
                    </button>
                </div>
            </nav>

            {/* ── Hero ────────────────────────────────────────────── */}
            <section className="landing-hero" id="hero">
                {/* Left column */}
                <div>
                    <h1 className="hero-headline">
                        Find your people.<br />
                        <span>Build amazing things.</span>
                    </h1>

                    <p className="hero-subhead">
                        CoFound helps verified students discover collaborators,
                        form teams, and build projects together — faster and easier.
                    </p>

                    <div className="hero-ctas">
                        <button
                            id="hero-get-started-btn"
                            className="btn btn-primary"
                            onClick={onGetStarted}
                        >
                            Get Started <ArrowRight size={17} />
                        </button>
                        <button
                            id="hero-login-btn"
                            className="btn btn-outline"
                            onClick={onLogin}
                        >
                            Log In
                        </button>
                    </div>

                    <div className="trust-badges">
                        <div className="trust-badge">
                            <ShieldCheck size={14} />
                            Verified Students Only
                        </div>
                        <div className="trust-badge">
                            <CheckCircle size={14} />
                            Safe &amp; Secure
                        </div>
                        <div className="trust-badge">
                            <Users size={14} />
                            Built for Collaboration
                        </div>
                    </div>
                </div>

                {/* Right column — floating card */}
                <div className="hero-visual">
                    <div className="hero-card">
                        <div className="hero-card-header">
                            <span className="hero-card-title">Explore Projects</span>
                            <span className="badge badge-open" style={{ fontSize: '0.72rem' }}>All Categories</span>
                        </div>

                        <div className="hero-card-search">
                            <Search size={13} />
                            <span>Search projects or skills…</span>
                        </div>

                        {DEMO_LISTINGS.map((l, i) => (
                            <div className="hero-listing-row" key={i}>
                                <div className="hero-listing-icon">{l.emoji}</div>
                                <div className="hero-listing-info">
                                    <div className="hero-listing-name">{l.name}</div>
                                    <div className="hero-listing-tags">{l.tags}</div>
                                </div>
                                <span className={`badge ${l.badgeClass}`}>{l.badge}</span>
                            </div>
                        ))}

                        {/* Floating mini notification */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '-18px',
                                right: '-18px',
                                background: 'var(--surface-raised)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                padding: '0.6rem 0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: 'var(--shadow-md)',
                                fontSize: '0.78rem',
                                color: 'var(--text-secondary)',
                                whiteSpace: 'nowrap',
                                animation: 'floatBadge 4s ease-in-out infinite',
                            }}
                        >
                            <div className="profile-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>N</div>
                            <span>Neha Singh accepted your join request</span>
                        </div>
                    </div>

                    {/* Floating user chat bubble */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-14px',
                            left: '-14px',
                            background: 'var(--surface-raised)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '0.65rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            boxShadow: 'var(--shadow-md)',
                            maxWidth: '220px',
                            animation: 'floatBadge 4s 2s ease-in-out infinite',
                        }}
                    >
                        <div className="profile-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>R</div>
                        <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Rohan Mehta</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Let's build something awesome 🚀</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features ─────────────────────────────────────────── */}
            <section className="features-section" id="features">
                <div className="features-inner">
                    <div className="features-label">FEATURES</div>

                    <h2 className="features-headline">
                        Everything you need<br />
                        <span style={{ color: 'var(--accent)' }}>to build together</span>
                    </h2>

                    <p className="features-subhead">
                        Powerful tools to help you find teammates, collaborate seamlessly,
                        and bring ideas to life.
                    </p>

                    <div className="features-grid">
                        {FEATURES.map((f, i) => (
                            <div className="feature-card" key={i}>
                                <div className="feature-icon">{f.icon}</div>
                                <div className="feature-title">{f.title}</div>
                                <div className="feature-desc">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it Works ─────────────────────────────────────── */}
            <section id="how-it-works" style={{ padding: '5rem 3rem', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
                <div className="features-label">HOW IT WORKS</div>
                <h2 className="features-headline" style={{ marginBottom: '3rem' }}>
                    Three steps to your <span style={{ color: 'var(--accent)' }}>dream team</span>
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
                    {[
                        { step: '01', icon: <Trophy size={22} />, title: 'Create your profile', desc: 'Sign up with your college email, add your skills, and get verified.' },
                        { step: '02', icon: <Search size={22} />, title: 'Browse & discover', desc: 'Explore listings by hackathons, startup ideas, college projects, and events.' },
                        { step: '03', icon: <Users size={22} />, title: 'Join or create a team', desc: 'Send join requests or post your own listing and build your team.' },
                    ].map((step, i) => (
                        <div
                            key={i}
                            style={{
                                background: 'var(--surface-raised)',
                                border: '1px solid var(--border)',
                                borderRadius: 16,
                                padding: '1.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className="feature-icon">{step.icon}</div>
                                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--border)', fontFamily: 'Outfit, sans-serif' }}>{step.step}</span>
                            </div>
                            <div className="feature-title" style={{ fontSize: '1.05rem' }}>{step.title}</div>
                            <div className="feature-desc">{step.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────────────── */}
            <section
                id="testimonials"
                style={{
                    padding: '5rem 3rem',
                    background: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border)',
                    borderBottom: '1px solid var(--border)',
                }}
            >
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div className="features-label">TESTIMONIALS</div>
                    <h2 className="features-headline" style={{ marginBottom: '2.5rem' }}>
                        What students are <span style={{ color: 'var(--accent)' }}>saying</span>
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                        {[
                            { name: 'Priya S.', role: 'B.Tech CSE, IIT Delhi', text: 'Found my entire hackathon team on CoFound in under 24 hours. Won 2nd place at Smart India Hackathon!', initials: 'PS' },
                            { name: 'Arjun V.', role: 'MCA, Parul University', text: 'The verified profiles gave me confidence. I knew my teammates were real, committed students.', initials: 'AV' },
                            { name: 'Sneha R.', role: 'B.Des, NID Ahmedabad', text: 'CoFound helped me find developers for my startup idea. The chat feature is perfect for collaboration.', initials: 'SR' },
                        ].map((t, i) => (
                            <div
                                key={i}
                                style={{
                                    background: 'var(--surface-raised)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 16,
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} size={14} fill="var(--accent)" color="var(--accent)" />
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1 }}>"{t.text}"</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>{t.initials}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ ─────────────────────────────────────────────── */}
            <section id="faq" style={{ padding: '5rem 3rem', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
                <div className="features-label">FAQ</div>
                <h2 className="features-headline" style={{ marginBottom: '2.5rem' }}>
                    Frequently asked <span style={{ color: 'var(--accent)' }}>questions</span>
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 720 }}>
                    {[
                        { q: 'Who can join CoFound?', a: 'Any currently enrolled college or university student. You\'ll verify your college email during onboarding.' },
                        { q: 'Is CoFound free to use?', a: 'Yes — CoFound is completely free for students. Create your profile, browse listings, and build teams at no cost.' },
                        { q: 'What types of projects can I find?', a: 'Hackathons, college projects, startup ideas, college events — any collaborative student initiative.' },
                        { q: 'How does email verification work?', a: 'After signing up, we\'ll send a 6-digit OTP to your college email address. Enter the code to get verified.' },
                    ].map((faq, i) => (
                        <details
                            key={i}
                            style={{
                                background: 'var(--surface-raised)',
                                border: '1px solid var(--border)',
                                borderRadius: 12,
                                padding: '1rem 1.25rem',
                                cursor: 'pointer',
                            }}
                        >
                            <summary style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {faq.q}
                                <Zap size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            </summary>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                {faq.a}
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            {/* ── Footer Strip ─────────────────────────────────────── */}
            <footer className="landing-footer-strip">
                <Users size={16} />
                Join thousands of students already building the future together.
            </footer>

            <style>{`
                @keyframes floatBadge {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
            `}</style>
        </div>
    );
};

export default LandingView;
