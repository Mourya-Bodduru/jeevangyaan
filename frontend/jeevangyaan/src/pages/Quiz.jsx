import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Login.css'; // Reusing form styles

const Quiz = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({}); // { 0: 'Option A', 1: 'Option B' }
    const [debateAnswer, setDebateAnswer] = useState('');
    const [debateResult, setDebateResult] = useState('');
    const [debateLoading, setDebateLoading] = useState(false);
    const [hasDebated, setHasDebated] = useState(false);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchModule = async () => {
            try {
                const res = await api.get(`/modules/${id}?lang=${i18n.language}`);
                setModule(res.data.data);
                setLoading(false);
            } catch (err) {
                setError(t("Load Quiz Error") || 'Failed to load quiz');
                setLoading(false);
            }
        };
        fetchModule();
    }, [id, i18n.language]);

    const handleOptionSelect = (questionIndex, option) => {
        setAnswers(prev => ({
            ...prev,
            [questionIndex]: option
        }));
    };

    const handleSubmit = async () => {
        // Validation: Ensure all questions are answered
        if (module.quiz.length > Object.keys(answers).length) {
            alert(t('Answer All Alert') || 'Please answer all questions before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            // Format answers for backend if needed, but sending object {index: answer} is fine based on our controller logic
            // Controller expects: { moduleId, answers: {0: "opt", 1: "opt"} } OR array
            // Let's send an array to match the questions order
            const answersArray = module.quiz.map((_, index) => answers[index]);

            const res = await api.post('/progress/submit-quiz', {
                moduleId: id,
                answers: answersArray,
                language: i18n.language
            }, config);

            setResult(res.data.data);
        } catch (err) {
            console.error(err);
            alert('Failed to submit quiz. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDebateReview = async () => {
        if (!debateAnswer.trim()) {
            alert('Please share your thoughts first.');
            return;
        }

        setDebateLoading(true);
        try {
            const res = await api.post('/ai/debate-assist', {
                topic: module.title,
                argument: debateAnswer,
                language: i18n.language || 'en'
            });
            setDebateResult(res.data.reply);
            setHasDebated(true);
        } catch (err) {
            console.error('Debate error:', err);
            setDebateResult(err.response?.data?.error || 'Sorry, JeevanGuru is offline right now.');
        } finally {
            setDebateLoading(false);
        }
    };

    if (loading) return <div className="loading-container">{t("Loading Quiz") || "Loading Quiz..."}</div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!module || !module.quiz || module.quiz.length === 0) return (
        <div className="error-container">
            <p>{t("No Quiz")}</p>
            <button onClick={() => navigate(-1)} className="btn-outline">{t("Go Back")}</button>
        </div>
    );

    // Render Result Modal
    if (result) {
        return (
            <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
                        {result.percentage >= 70 ? '🎉' : '📚'}
                    </div>
                    <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>{t("Quiz Completed")}</h2>
                    <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
                        {t("You Scored")} <strong>{result.score}/{result.total}</strong> ({result.percentage}%)
                    </p>

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-primary"
                        >
                            {t("Go Dashboard")}
                        </button>
                        <button
                            onClick={() => { setResult(null); setAnswers({}); setDebateAnswer(''); setDebateResult(''); setHasDebated(false); }}
                            className="btn-outline"
                        >
                            {t("Retry Quiz")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="form-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="form-header">
                    <h2>{t("Quiz")}: {module.title}</h2>
                    <button onClick={() => navigate(-1)} className="btn-outline">{t("Cancel")}</button>
                </div>

                <div className="quiz-questions">
                    {module.quiz.map((q, index) => (
                        <div key={index} style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                            <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>{index + 1}. {q.question}</h4>
                            <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {q.options.map((opt, i) => (
                                    <label
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px',
                                            background: answers[index] === opt ? '#e3f2fd' : 'white',
                                            border: answers[index] === opt ? '2px solid #2196f3' : '2px solid #eee',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${index}`}
                                            value={opt}
                                            checked={answers[index] === opt}
                                            onChange={() => handleOptionSelect(index, opt)}
                                            style={{ marginRight: '10px' }}
                                        />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div style={{ marginBottom: '30px', padding: '20px', background: '#fffbeb', borderRadius: '12px', border: '2px dashed #f59e0b' }}>
                        <h4 style={{ marginBottom: '15px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            💡 {t("Bonus Discussion")}
                        </h4>
                        <p style={{ color: '#78350f', marginBottom: '15px' }}>
                            {t("Discussion Prompt", { title: module.title })}
                        </p>
                        <textarea
                            value={debateAnswer}
                            onChange={(e) => setDebateAnswer(e.target.value)}
                            disabled={hasDebated}
                            rows="4"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #fcd34d',
                                marginBottom: '15px',
                                boxSizing: 'border-box',
                                backgroundColor: hasDebated ? '#f8fafc' : 'white',
                                cursor: hasDebated ? 'not-allowed' : 'text'
                            }}
                            placeholder={t("Share Perspective Placeholder") || "Share your perspective..."}
                        />

                        <button
                            onClick={handleDebateReview}
                            disabled={debateLoading || !debateAnswer.trim() || hasDebated}
                            style={{
                                padding: '10px 20px',
                                background: (debateLoading || hasDebated) ? '#fbbf24' : '#f59e0b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: (debateLoading || hasDebated) ? 'not-allowed' : 'pointer',
                                fontWeight: '500',
                                float: 'right'
                            }}
                        >
                            {hasDebated ? t('Feedback Received') : debateLoading ? t('Thinking') : t('Get AI Feedback')}
                        </button>
                        <div style={{ clear: 'both' }}></div>

                        {debateResult && (
                            <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', border: '1px solid #fed7aa', whiteSpace: 'pre-wrap', color: '#334155' }}>
                                <strong>{t("JeevanGuru Says")}:</strong><br /><br />
                                {debateResult}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '30px' }}>
                    <button
                        onClick={handleSubmit}
                        className="btn-primary"
                        disabled={submitting}
                        style={{ padding: '12px 30px', fontSize: '1.1rem' }}
                    >
                        {submitting ? t("Submitting") : t("Submit Quiz")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
