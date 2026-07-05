import React, { useState, useEffect, useRef } from 'react';
import {
    Bell, LogOut, Trophy, Mail, ShieldCheck, Sun, Moon,
    LayoutDashboard, Compass, ListOrdered, Inbox, MessageSquare,
    User as UserIcon, Plus, ChevronDown, Menu, X
} from 'lucide-react';
import AuthView from './views/AuthView';
import LandingView from './views/LandingView';
import FeedView from './views/FeedView';
import DashboardView from './views/DashboardView';
import ProfileView from './views/ProfileView';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from './config';
import logoDark from './assets/logo-dark.svg';
import logoLight from './assets/logo-light.svg';

// ─── Nav config ────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard',   icon: <LayoutDashboard size={18} /> },
    { id: 'feed',      label: 'Explore',      icon: <Compass size={18} /> },
    { id: 'listings',  label: 'My Listings',  icon: <ListOrdered size={18} /> },
    { id: 'requests',  label: 'Requests',     icon: <Inbox size={18} /> },
    { id: 'messages',  label: 'Messages',     icon: <MessageSquare size={18} /> },
    { id: 'profile',   label: 'Profile',      icon: <UserIcon size={18} /> },
];

const VIEW_TITLES = {
    dashboard: 'Dashboard',
    feed:      'Explore',
    listings:  'My Listings',
    requests:  'Requests',
    messages:  'Messages',
    profile:   'Profile',
};

function App() {
    // ── Auth ──────────────────────────────────────────────────────────────
    const [user, setUser] = useState(null);

    // ── Routing ───────────────────────────────────────────────────────────
    // 'landing' | 'auth' | 'dashboard' | 'feed' | 'profile' | 'listings' | 'requests' | 'messages'
    const [currentView, setCurrentView] = useState('landing');
    const [authMode, setAuthMode]     = useState('login'); // 'login' | 'register'
    const [viewProfileId, setViewProfileId] = useState(null);

    // ── Theme ─────────────────────────────────────────────────────────────
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('cf-theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cf-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    // ── Notifications ─────────────────────────────────────────────────────
    const [notifications, setNotifications]     = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [toast, setToastState]                = useState(null);

    // ── OTP banner ────────────────────────────────────────────────────────
    const [otpSent, setOtpSent]     = useState(false);
    const [otpInput, setOtpInput]   = useState('');
    const [otpLoading, setOtpLoading] = useState(false);

    // ── Sidebar (mobile) ──────────────────────────────────────────────────
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // ── Profile dropdown ──────────────────────────────────────────────────
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef   = useRef(null);
    const notifMenuRef     = useRef(null);

    // ── Create Listing modal ──────────────────────────────────────────────
    const [showCreateModal, setShowCreateModal] = useState(false);

    // ─── Load user from storage ──────────────────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            setUser(JSON.parse(stored));
            setCurrentView('dashboard');
        }
    }, []);

    // ─── Socket & notifications ──────────────────────────────────────────
    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            socket.emit('join', user._id);
        });

        socket.on('new_notification', (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
            setToast({ type: 'info', message: newNotif.message });
        });

        fetchNotifications(user.token);

        return () => { socket.disconnect(); };
    }, [user]);

    // ─── Close dropdowns on outside click ───────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
            if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ─── Helper functions ────────────────────────────────────────────────
    const fetchNotifications = async (token) => {
        try {
            const res = await fetch(`${API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) setNotifications(data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const setToast = (toastObj) => {
        setToastState(toastObj);
        if (toastObj) {
            const timer = setTimeout(() => setToastState(null), 4000);
            return () => clearTimeout(timer);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        setCurrentView('landing');
        setViewProfileId(null);
        setNotifications([]);
        setOtpSent(false);
        setOtpInput('');
        setToast({ type: 'success', message: 'Logged out successfully.' });
    };

    const handleSendOTP = async () => {
        setOtpLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok) {
                setOtpSent(true);
                setToast({ type: 'success', message: 'OTP sent! Check your email.' });
            } else {
                setToast({ type: 'error', message: data.message || 'Failed to send OTP' });
            }
        } catch {
            setToast({ type: 'error', message: 'Failed to send OTP' });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpInput.trim()) return;
        setOtpLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify({ otp: otpInput.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                const updatedUser = { ...user, isVerified: true };
                setUser(updatedUser);
                localStorage.setItem('userInfo', JSON.stringify(updatedUser));
                setOtpSent(false);
                setOtpInput('');
                setToast({ type: 'success', message: '✅ Email verified successfully!' });
            } else {
                setToast({ type: 'error', message: data.message || 'Invalid OTP' });
            }
        } catch {
            setToast({ type: 'error', message: 'Verification failed' });
        } finally {
            setOtpLoading(false);
        }
    };

    const markAllNotificationsAsRead = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/api/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` },
            });
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, read: true })));
            }
        } catch (err) {
            console.error('Failed to mark notifications as read', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            try {
                await fetch(`${API_URL}/api/notifications/${notif._id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${user.token}` },
                });
                setNotifications(notifications.map(n =>
                    n._id === notif._id ? { ...n, read: true } : n
                ));
            } catch (err) {
                console.error(err);
            }
        }
        setCurrentView('dashboard');
        setShowNotifications(false);
    };

    const handleProfileClick = (profileId) => {
        setViewProfileId(profileId);
        setCurrentView('profile');
        setSidebarOpen(false);
    };

    const handleProfileUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    const navigateTo = (view) => {
        setCurrentView(view);
        setViewProfileId(null);
        setSidebarOpen(false);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    // ── User initials helper ─────────────────────────────────────────────
    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    // ─── RENDER — unauthenticated pages ──────────────────────────────────
    if (!user) {
        if (currentView === 'auth') {
            return (
                <AuthView
                    onAuthSuccess={(userData) => {
                        setUser(userData);
                        setCurrentView('dashboard');
                    }}
                    setNotification={setToast}
                    onBackToLanding={() => setCurrentView('landing')}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                    initialMode={authMode}
                />
            );
        }

        // Default: landing
        return (
            <>
                <LandingView
                    onGetStarted={() => { setAuthMode('register'); setCurrentView('auth'); }}
                    onLogin={() => { setAuthMode('login'); setCurrentView('auth'); }}
                    theme={theme}
                    onThemeToggle={toggleTheme}
                />
                {/* Toast (landing) */}
                {toast && (
                    <div className="toast-container">
                        <div className={`toast ${toast.type}`}>{toast.message}</div>
                    </div>
                )}
            </>
        );
    }

    // ─── RENDER — authenticated inner view ───────────────────────────────
    const renderInnerView = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <DashboardView
                        user={user}
                        onViewProfile={handleProfileClick}
                        setNotification={setToast}
                        onNavigate={navigateTo}
                    />
                );
            case 'profile':
                return (
                    <ProfileView
                        user={user}
                        viewProfileId={viewProfileId}
                        onBack={() => { setCurrentView('feed'); setViewProfileId(null); }}
                        onProfileUpdate={handleProfileUpdate}
                        setNotification={setToast}
                    />
                );
            case 'listings':
                // My listings = dashboard filtered; reuse DashboardView in listings mode
                return (
                    <DashboardView
                        user={user}
                        onViewProfile={handleProfileClick}
                        setNotification={setToast}
                        onNavigate={navigateTo}
                        defaultTab="listings"
                    />
                );
            case 'requests':
                return (
                    <DashboardView
                        user={user}
                        onViewProfile={handleProfileClick}
                        setNotification={setToast}
                        onNavigate={navigateTo}
                        defaultTab="requests"
                    />
                );
            case 'messages':
                return (
                    <DashboardView
                        user={user}
                        onViewProfile={handleProfileClick}
                        setNotification={setToast}
                        onNavigate={navigateTo}
                        defaultTab="messages"
                    />
                );
            case 'feed':
            default:
                return (
                    <FeedView
                        user={user}
                        onViewProfile={handleProfileClick}
                        setNotification={setToast}
                    />
                );
        }
    };

    return (
        <div className="app-shell" data-theme={theme}>
            {/* ── Sidebar overlay (mobile) ─────────────────────── */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 49,
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ──────────────────────────────────────── */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div
                    className="sidebar-logo"
                    onClick={() => navigateTo('dashboard')}
                    style={{ cursor: 'pointer' }}
                >
                    <img
                        src={theme === 'dark' ? logoDark : logoLight}
                        alt="CoFound"
                        style={{ height: 30 }}
                    />
                </div>

                {/* Nav links */}
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <div
                            key={item.id}
                            id={`nav-${item.id}`}
                            className={`sidebar-link ${currentView === item.id ? 'active' : ''}`}
                            onClick={() => navigateTo(item.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === 'Enter' && navigateTo(item.id)}
                            aria-label={item.label}
                            aria-current={currentView === item.id ? 'page' : undefined}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                {/* Create Listing CTA */}
                <div className="sidebar-bottom">
                    <button
                        id="sidebar-create-btn"
                        className="sidebar-create-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Plus size={16} /> Create Listing
                    </button>
                </div>
            </aside>

            {/* ── Main area ─────────────────────────────────────── */}
            <div className="main-area">
                {/* OTP verification banner */}
                {user && !user.isVerified && (
                    <div className="otp-banner">
                        <span className="otp-banner-text">
                            <Mail size={14} />
                            Verify your email to unlock all features.
                        </span>
                        {!otpSent ? (
                            <button
                                className="btn btn-outline btn-sm"
                                style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }}
                                onClick={handleSendOTP}
                                disabled={otpLoading}
                            >
                                {otpLoading ? 'Sending…' : 'Send OTP'}
                            </button>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter 6-digit OTP"
                                    value={otpInput}
                                    onChange={e => setOtpInput(e.target.value)}
                                    maxLength={6}
                                    style={{ width: 130, padding: '0.3rem 0.8rem', fontSize: '0.85rem', letterSpacing: '0.15em' }}
                                />
                                <button
                                    className="btn btn-sm"
                                    style={{ background: '#f59e0b', color: 'white', gap: '0.3rem' }}
                                    onClick={handleVerifyOTP}
                                    disabled={otpLoading || !otpInput.trim()}
                                >
                                    {otpLoading ? 'Verifying…' : <><ShieldCheck size={13} /> Verify</>}
                                </button>
                                <span
                                    style={{ color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                                    onClick={handleSendOTP}
                                >
                                    Resend
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* Top bar */}
                <header className="topbar">
                    {/* Mobile menu toggle */}
                    <button
                        className="btn btn-ghost btn-icon"
                        style={{ display: 'none' }}
                        id="mobile-menu-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    <span className="topbar-title">
                        {VIEW_TITLES[currentView] || 'CoFound'}
                    </span>

                    <div className="topbar-right">
                        {/* Theme toggle */}
                        <button
                            id="theme-toggle-btn"
                            className="theme-toggle"
                            onClick={toggleTheme}
                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {/* Notification bell */}
                        <div className="notification-container" ref={notifMenuRef}>
                            <button
                                id="notif-bell-btn"
                                className="bell-btn"
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfileMenu(false);
                                }}
                                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                            >
                                <Bell size={17} />
                                {unreadCount > 0 && (
                                    <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="notification-dropdown" id="notif-dropdown">
                                    <div className="notification-header">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <span
                                                className="notification-clear"
                                                onClick={markAllNotificationsAsRead}
                                                role="button"
                                            >
                                                Mark all read
                                            </span>
                                        )}
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length === 0 ? (
                                            <div className="empty-state" style={{ padding: '1.5rem 0' }}>
                                                <Bell size={28} />
                                                <span className="empty-state-title">No notifications yet</span>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 12).map((notif) => (
                                                <div
                                                    key={notif._id}
                                                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                    onClick={() => handleNotificationClick(notif)}
                                                >
                                                    <div>{notif.message}</div>
                                                    <div className="notification-time">
                                                        {new Date(notif.createdAt).toLocaleTimeString([], {
                                                            hour: '2-digit', minute: '2-digit',
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile menu */}
                        <div style={{ position: 'relative' }} ref={profileMenuRef}>
                            <button
                                id="profile-menu-btn"
                                className="profile-menu-btn"
                                onClick={() => {
                                    setShowProfileMenu(!showProfileMenu);
                                    setShowNotifications(false);
                                }}
                                aria-label="Profile menu"
                            >
                                <div className="profile-avatar">{initials}</div>
                                <span className="profile-menu-name">{user.name}</span>
                                <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
                            </button>

                            {showProfileMenu && (
                                <div className="profile-dropdown" id="profile-dropdown">
                                    <button
                                        id="profile-view-btn"
                                        className="profile-dropdown-item"
                                        onClick={() => {
                                            setViewProfileId(null);
                                            setCurrentView('profile');
                                            setShowProfileMenu(false);
                                        }}
                                    >
                                        <UserIcon size={15} /> View Profile
                                    </button>
                                    <button
                                        id="profile-edit-btn"
                                        className="profile-dropdown-item"
                                        onClick={() => {
                                            setViewProfileId(null);
                                            setCurrentView('profile');
                                            setShowProfileMenu(false);
                                        }}
                                    >
                                        <ShieldCheck size={15} /> Edit Profile
                                    </button>
                                    <div className="profile-dropdown-divider" />
                                    <button
                                        id="profile-logout-btn"
                                        className="profile-dropdown-item danger"
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            handleLogout();
                                        }}
                                    >
                                        <LogOut size={15} /> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="main-content">
                    {renderInnerView()}
                </main>
            </div>

            {/* ── Create Listing Modal placeholder ───────────────── */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="modal-title">Create New Listing</span>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Use the Explore page to create a new listing via the "+ New Listing" button, or use the Dashboard.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => { setCurrentView('feed'); setShowCreateModal(false); }}
                            >
                                Go to Explore
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast ─────────────────────────────────────────── */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>{toast.message}</div>
                </div>
            )}

            {/* ── Mobile menu btn reveal via CSS ────────────────── */}
            <style>{`
                @media (max-width: 768px) {
                    #mobile-menu-btn { display: flex !important; }
                }
            `}</style>
        </div>
    );
}

export default App;