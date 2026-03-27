import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Header.css";
import jg from "../assets/jg.png";
import api from "../api";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

const Header = ({ isAdminPage }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    try {
      await api.delete('/ai/chat-history');
    } catch (err) {
      console.error("Failed to clear chat history on logout:", err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const handleSelectLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi (हिंदी)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
    { code: 'ur', name: 'Urdu (اردو)' },
    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)' },
    { code: 'sa', name: 'Sanskrit (संस्कृतम्)' },
    { code: 'ne', name: 'Nepali (नेपाली)' },
    { code: 'ks', name: 'Kashmiri (کأشُر)' },
    { code: 'gom', name: 'Konkani (कोंकणी)' },
    { code: 'as', name: 'Assamese (অসমীয়া)' }
  ];

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/home" className="logo-link">
          <img src={jg} alt="JeevanGyaan Logo" />
          <span>JeevanGyaan</span>
        </Link>
      </div>

      <div className="nav-right">
        {!isAdminPage && (
          <select
            onChange={(e) => handleSelectLanguage(e.target.value)}
            defaultValue={i18n.language || 'en'}
            className="btn-outline"
            style={{ marginRight: '15px', maxWidth: '120px' }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        )}

        {localStorage.getItem('user') ? (
          <>
            {JSON.parse(localStorage.getItem('user')).role === 'admin' ? (
              <Link to="/admin/dashboard" className="btn-outline">
                {t("Dashboard")}
              </Link>
            ) : (
              <Link to="/dashboard" className="btn-outline">
                {t("Dashboard")}
              </Link>
            )}
            <button
              className="btn-primary"
              onClick={() => setShowLogoutModal(true)}
            >
              {t("Sign Out")}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-outline">
              {t("Login")}
            </Link>
            <Link to="/register" className="btn-primary">
              {t("Register")}
            </Link>
          </>
        )}
      </div>
      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title={t("Logout Title")}
        message={t("Logout Message")}
        confirmText={t("Logout Confirm")}
        cancelText={t("Logout Cancel")}
        variant="warning"
        icon="👋"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </nav>
  );
};

export default Header;
