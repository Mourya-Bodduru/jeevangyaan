import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/ChallengeUpload.css';

const ChallengeUpload = ({ moduleId }) => {
    const { t } = useTranslation();
    const [history, setHistory] = useState([]);
    const [challengeText, setChallengeText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchHistory();
    }, [moduleId]);

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/challenges/${moduleId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data.data);
        } catch (err) {
            console.error("Failed to load challenge history", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!challengeText.trim()) {
            setError(t("Challenge Request"));
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await api.post(`/challenges/${moduleId}`, { challengeText }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(t("Challenge Success"));
            setChallengeText('');
            fetchHistory(); // refresh the list to show the new submission
        } catch (err) {
            setError(err.response?.data?.error || t("Challenge Fail"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="challenge-upload-container">
            <h3 className="challenge-title">🌍 {t("Challenge Tracker Title")}</h3>
            <p className="challenge-desc">
                {t("Challenge Tracker Desc")}
            </p>

            {error && <div className="challenge-error">{error}</div>}
            {success && <div className="challenge-success">{success}</div>}

            <form onSubmit={handleSubmit} className="challenge-form">
                <textarea
                    value={challengeText}
                    onChange={(e) => setChallengeText(e.target.value)}
                    placeholder={t("Challenge Placeholder")}
                    rows="4"
                    disabled={submitting}
                    className="challenge-textarea"
                ></textarea>
                <button type="submit" disabled={submitting || !challengeText.trim()} className="challenge-submit-btn">
                    {submitting ? t("Submitting") : t("Submit AI Review")}
                </button>
            </form>

            {history.length > 0 && (
                <div className="challenge-history">
                    <h4 className="history-title">{t("Past Submissions")}</h4>
                    <div className="history-list">
                        {history.map((sub, idx) => (
                            <div key={idx} className="history-card">
                                <div className="history-date">{new Date(sub.createdAt).toLocaleDateString()}</div>
                                <div className="history-user-text">
                                    <strong>{t("You Wrote")}</strong> "{sub.challengeText}"
                                </div>
                                <div className="history-ai-feedback">
                                    <strong>{t("JeevanGuru Feedback")}</strong> {sub.aiFeedback}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChallengeUpload;
