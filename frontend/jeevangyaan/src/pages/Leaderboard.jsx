
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import Loader from '../components/Loader';
import '../styles/Leaderboard.css';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const currentUserRef = useRef(null);
    const { t } = useTranslation();

    useEffect(() => {
        // Get current user to highlight
        const userData = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(userData);

        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('/progress/leaderboard');
                setLeaderboard(res.data.data);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
                setError('Failed to load leaderboard. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    // Auto-scroll to current user after loading
    useEffect(() => {
        if (!loading && currentUserRef.current) {
            setTimeout(() => {
                currentUserRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 500); // Small delay to ensure rendering
        }
    }, [loading, leaderboard]);

    if (loading) return <Loader />;

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-header">
                <h1>🏆 {t("Global Leaderboard")}</h1>
                <p>{t("Top Learners")}</p>
            </div>

            {error && <div className="error-message">{t("Load Leaderboard Error")}</div>}
 
            <div className="leaderboard-content">
                <div className="leaderboard-table-wrapper">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{t("Learner")}</th>
                                <th>{t("Total Score")}</th>
                                <th>{t("Modules Completed")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.length > 0 ? (
                                leaderboard.map((user, index) => {
                                    const isCurrentUser = currentUser && user._id === currentUser._id;
                                    return (
                                        <tr
                                            key={user._id}
                                            className={`rank-${index + 1} ${isCurrentUser ? 'current-user-highlight' : ''}`}
                                            ref={isCurrentUser ? currentUserRef : null}
                                        >
                                            <td className="rank-cell">
                                                {index === 0 && '🥇'}
                                                {index === 1 && '🥈'}
                                                {index === 2 && '🥉'}
                                                {index > 2 && index + 1}
                                            </td>
                                            <td className="user-cell">
                                                <div className="user-info">
                                                    <div className="user-avatar-placeholder">
                                                        {user.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="username">
                                                            {user.username} {isCurrentUser && t("CurrentUser Tag")}
                                                        </span>
                                                        {user.role === 'admin' && <span className="admin-badge">{t("Admin Header")}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="score-cell">{user.totalScore}</td>
                                            <td className="modules-cell">{user.modulesCompleted}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="4" className="empty-state">
                                        {t("No Data")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
