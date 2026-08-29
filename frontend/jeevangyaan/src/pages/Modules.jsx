import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Modules.css';

const Modules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await api.get(`/modules?lang=${i18n.language}`);
        console.log('Modules API Response:', res.data); // Debug log
        setModules(res.data.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Modules API Error:', err); // Debug log
        setError('Failed to fetch modules. Please try again later.');
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handleModuleClick = (moduleId) => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate(`/modules/${moduleId}`);
    } else {
      setShowModal(true);
    }
  };

  const closeModal = () => setShowModal(false);

  if (loading) return <div className="loading-container">{t("Loading Modules")}</div>;
  if (error) return <div className="error-container">{t("Fetch Modules Error")}</div>;

  return (
    <div className="modules-container">
      <h2>{t("All Learning Modules")}</h2>
      {!modules || modules.length === 0 ? (
        <p className="no-modules">{t("No modules found")}</p>
      ) : (
        <ul className="modules-grid">
          {modules.map((module) => (
            <li key={module._id} className="module-card" onClick={() => handleModuleClick(module._id)}>
              {module.image && (
                <div className="module-card-img" style={{ height: '200px', overflow: 'hidden', marginBottom: '15px', borderRadius: '8px 8px 0 0', margin: '-25px -25px 15px -25px' }}>
                  <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${module.image}`} alt={module.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="module-card-content">
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <span className="category-tag">{module.category}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Login Required Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <div className="modal-icon">🔒</div>
            <h3>{t("Access Restricted")}</h3>
            <p>{t("Login Required")}</p>
            <p>{t("Please Login")}</p>
            <div className="modal-actions">
              <button onClick={() => navigate('/login')} className="btn-primary">{t("Login")}</button>
              <button onClick={() => navigate('/register')} className="btn-outline">{t("Register")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modules;
