import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import api from '../api';
import '../styles/UserDashboard.css';
import '../styles/Modules.css';

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const fetchProgress = useCallback(async () => {
        try {
            const lang = i18n.language || 'en';
            const res = await api.get(`/progress/categories?lang=${lang}`);
            setProgressData(res.data.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(t("Load Progress Error") || 'Failed to load progress data');
            setLoading(false);
        }
    }, [i18n.language, t]);
 
    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await api.get('/auth/profile');
            const latestUser = res.data.data;
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));
        } catch (err) {
            console.error('Failed to fetch user profile:', err);
        }
    }, []);
 
    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData) {
            navigate('/login');
            return;
        }
        setUser(userData);
        fetchProgress();
        fetchUserProfile();
 
        // Listen for storage changes to update coin count
        const handleStorageChange = () => {
            const updatedUser = JSON.parse(localStorage.getItem('user'));
            if (updatedUser) setUser(updatedUser);
        };
        window.addEventListener('storage', handleStorageChange);
 
        return () => window.removeEventListener('storage', handleStorageChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i18n.language, fetchUserProfile, fetchProgress]);
 
 
 
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({
        queryInfo: '',
        reason: '',
        requiredThings: ''
    });
    const [requestMessage, setRequestMessage] = useState({ type: '', text: '' });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
 
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
 
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: t("Passwords Not Match") });
            return;
        }
 
        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', text: t("Password Length Error") });
            return;
        }
 
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setMessage({ type: 'success', text: t("Password Success") });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setShowProfileModal(false), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || t("Password Fail") });
        }
    };
 
    const handleJoinCommunity = async () => {
        try {
            const res = await api.post('/community/join');
            const updatedUser = { ...user, ...res.data.data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Dispatch storage event for other components
            window.dispatchEvent(new Event('storage'));
            
            alert(t("Welcome Comm Alert"));
            navigate('/community');
        } catch (err) {
            alert(err.response?.data?.error || t("Join Community Error") || 'Failed to join community');
        }
    };
 
    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setRequestMessage({ type: '', text: '' });
 
        try {
            await api.post('/requests', requestForm);
            setRequestMessage({ type: 'success', text: t("Request Success") });
            setRequestForm({ queryInfo: '', reason: '', requiredThings: '' });
            setTimeout(() => {
                setShowRequestModal(false);
                setRequestMessage({ type: '', text: '' });
            }, 2000);
        } catch (err) {
            setRequestMessage({ type: 'error', text: err.response?.data?.message || t("Request Fail") });
        }
    };
 
    if (loading) return <div className="loading-container">{t("Loading Dashboard...")}</div>;
 
    return (
        <div className="user-dashboard-container">
            {/* Header with Profile Icon */}
            <div className="dashboard-header">
                <div className="header-logo">
                    {/* Logo removed as per user request */}
                </div>
                <div className="coin-display" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 215, 0, 0.1)', padding: '8px 15px', borderRadius: '20px', border: '1px solid #ffd700', fontWeight: 'bold', color: '#b8860b' }}>
                    <span style={{ marginRight: '5px', fontSize: '1.2rem' }}>🪙</span> {user?.coins || 0}
                </div>
                <button
                    className="submit-query-btn"
                    onClick={() => setShowRequestModal(true)}
                >
                    <span>📝</span> {t("Submit Query")}
                </button>
                <div
                    className="header-profile-icon"
                    onClick={() => setShowProfileModal(true)}
                    title={t("View Profile") || "View Profile"}
                >
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
            </div>
 
            {/* Main Content */}
            <div className="dashboard-content">
                <div className="welcome-banner">
                    <h2>{t("Welcome User")}, {user?.username}!</h2>
                    <p>{t("Continue Learning")}</p>
                </div>
 
                {/* Categories Section */}
                <div className="dashboard-modules-header">
                    <h3>{t("Learning Progress")}</h3>
                    <div className="dashboard-header-actions">
                        <Link to="/scenario-simulator" className="leaderboard-btn" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}>
                            <span>👦</span> {t("Scenario Simulator") || "3D Roleplay Simulator"}
                        </Link>
                        <Link to="/leaderboard" className="leaderboard-btn">
                            <span>👑</span> {t("View Leaderboard")}
                        </Link>
                        <button 
                            className="leaderboard-btn" 
                            style={{ 
                                background: (user?.communityJoined || user?.coins >= 5) ? 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' : '#94a3b8',
                                opacity: (user?.communityJoined || user?.coins >= 5) ? 1 : 0.8,
                                cursor: (user?.communityJoined || user?.coins >= 5) ? 'pointer' : 'not-allowed'
                            }}
                            onClick={() => {
                                if (user?.communityJoined) {
                                    navigate('/community');
                                } else if (user?.coins >= 5) {
                                    if (window.confirm(t("Confirm Community"))) {
                                        handleJoinCommunity();
                                    }
                                } else {
                                    alert(`${t("Need Coins Error") || "You need at least 5 coins to join the community!"} ${t("Current Coins") || "You currently have"} ${user?.coins || 0} coins.`);
                                }
                            }}
                        >
                            <span>{user?.communityJoined ? '🌍' : (user?.coins >= 5 ? '🔓' : '🔒')}</span> 
                            {user?.communityJoined ? t("Enter Community Hub") : (user?.coins >= 5 ? t("Unlock Community") : `🔒 ${t("Community")} (5 coins)`)}
                        </button>
                    </div>
                </div>
 
                {error ? (
                    <div className="error-container">{error}</div>
                ) : (
                    <div className="categories-grid">
                        {progressData.length > 0 ? (
                            progressData.map((item, index) => (
                                <Link to={`/category/${item.originalCategory || item.category}`} key={index} className="category-card">
                                    <div className="category-header">
                                        <div className="category-icon">📚</div>
                                        <h3>{item.category}</h3>
                                    </div>
 
                                    <div className="progress-section">
                                        <div style={{ width: 60, height: 60, margin: '0 auto 10px' }}>
                                            <CircularProgressbar
                                                value={item.percentage}
                                                text={`${item.percentage}%`}
                                                styles={buildStyles({
                                                    textSize: '22px',
                                                    pathTransitionDuration: 0.5,
                                                    pathColor: `rgba(62, 152, 199, ${item.percentage / 100})`,
                                                    textColor: '#333',
                                                    trailColor: '#d6d6d6',
                                                    backgroundColor: '#3e98c7',
                                                })}
                                            />
                                        </div>
                                        <p className="module-count">{item.completed} / {item.total} {t("Modules Completed")}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p>{t("No Categories")}</p>
                        )}
                    </div>
                )}
            </div>
 
            {/* Profile Modal */}
            {showProfileModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal">
                        <button className="close-modal-btn" onClick={() => setShowProfileModal(false)}>&times;</button>
 
                        <div className="modal-header">
                            <div className="modal-avatar">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <h3>{user?.username}</h3>
                            <p>{user?.email}</p>
                            <span className="user-role-badge">{user?.role}</span>
                        </div>
 
                        <div className="password-change-section">
                            <h4>{t("Change Password")}</h4>
                            {message.text && (
                                <div className={`message-alert ${message.type}`}>
                                    {message.text}
                                </div>
                            )}
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label>{t("Current Password")}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t("New Password")}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        required
                                        minLength="6"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t("Confirm Password")}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="save-btn">{t("Update Password")}</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
 
            {/* User Request Modal */}
            {showRequestModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal request-modal-content" style={{ maxWidth: '500px' }}>
                        <button className="close-modal-btn" onClick={() => setShowRequestModal(false)}>&times;</button>
                        <div className="modal-header">
                            <div className="modal-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '70px', height: '70px', fontSize: '2.5rem' }}>
                                📝
                            </div>
                            <h3>{t("Submit Query")}</h3>
                            <p>{t("Request Subtitle") || "Send a query to the admin"}</p>
                        </div>
 
                        <div className="password-change-section" style={{ borderTop: '1px solid #eee', paddingTop: '10px' }}>
                            {requestMessage.text && (
                                <div className={`message-alert ${requestMessage.type}`}>
                                    {requestMessage.text}
                                </div>
                            )}
                            <form onSubmit={handleRequestSubmit}>
                                <div className="form-group">
                                    <label>{t("Query Info")}</label>
                                    <textarea
                                        value={requestForm.queryInfo}
                                        onChange={(e) => setRequestForm({ ...requestForm, queryInfo: e.target.value })}
                                        required
                                        rows="3"
                                        placeholder={t("Placeholder Query")}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t("Reason")}</label>
                                    <textarea
                                        value={requestForm.reason}
                                        onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                                        required
                                        rows="2"
                                        placeholder={t("Placeholder Reason")}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t("Required Things")}</label>
                                    <textarea
                                        value={requestForm.requiredThings}
                                        onChange={(e) => setRequestForm({ ...requestForm, requiredThings: e.target.value })}
                                        required
                                        rows="2"
                                        placeholder={t("Placeholder Requirements")}
                                    />
                                </div>
                                <button type="submit" className="request-submit-btn">{t("Submit Request")}</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserDashboard;
