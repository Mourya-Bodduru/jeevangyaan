import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Modules.css'; // Reuse existing module card styles

const CategoryModules = () => {
    const { category } = useParams();
    const { i18n, t } = useTranslation();
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [progressMap, setProgressMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lang = i18n.language || 'en';
                const [modulesRes, progressRes] = await Promise.all([
                    api.get(`/modules?lang=${lang}`),
                    api.get('/progress/user-progress')
                ]);

                const categoryModules = modulesRes.data.data.filter(
                    m => (m.originalCategory || m.category) === category
                );

                setModules(categoryModules);
                setProgressMap(progressRes.data.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load data');
                setLoading(false);
            }
        };
        fetchData();
    }, [category]);

    if (loading) return <div className="loading-container">{t("Loading Module")} {category} {t("Modules")}...</div>;
 
    return (
        <div className="modules-container">
            <div className="back-btn-container" style={{ marginBottom: '20px' }}>
                <button onClick={() => navigate('/dashboard')} className="btn-outline" style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', background: 'white', cursor: 'pointer' }}>
                    &larr; {t("Back Dashboard")}
                </button>
            </div>
 
            <div className="dashboard-modules-header">
                <h2>{modules.length > 0 ? modules[0].category : category} {t("Modules")}</h2>
                <p>{t("Explore Category")}</p>
            </div>
 
            {error ? (
                <div className="error-container">{t("Load Module Error")}</div>
            ) : modules.length > 0 ? (
                <ul className="modules-grid">
                    {modules.map((module) => {
                        const progress = progressMap[module._id];
                        const isCompleted = progress?.isCompleted;
                        const score = progress?.quizScore;
 
                        return (
                            <li key={module._id} className="module-card" style={{ border: isCompleted ? '2px solid #10b981' : '1px solid #eee' }}>
                                {module.image && (
                                    <div className="module-card-img" style={{ height: '180px', overflow: 'hidden', marginBottom: '15px', borderRadius: '8px' }}>
                                        <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${module.image}`} alt={module.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <h3>{module.title}</h3>
                                <p>{module.description}</p>
 
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', marginBottom: '15px' }}>
                                    <span className="category-tag">{module.category}</span>
                                    {isCompleted && (
                                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            ✅ {t("Completed")}
                                        </span>
                                    )}
                                </div>
 
                                {score !== undefined && (
                                    <div style={{ background: '#f0f9ff', padding: '8px', borderRadius: '6px', textAlign: 'center', marginBottom: '15px', fontSize: '0.9rem', color: '#0369a1' }}>
                                        🎯 {t("Quiz Score")} : <strong>{score}%</strong>
                                    </div>
                                )}
 
                                <Link to={`/modules/${module._id}`} className="auth-btn" style={{ textAlign: 'center', marginTop: 'auto', display: 'block' }}>
                                    {isCompleted ? t('Review Module') : t('Start Learning')}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p>{t("No Modules Category")}</p>
            )}
        </div>
    );
};

export default CategoryModules;
