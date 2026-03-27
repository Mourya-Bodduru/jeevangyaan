import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from '@react-oauth/google';
import api from "../api";
import "../styles/Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || t("Login Failed"));
    }
  };
 
 
  // Helper to decode JWT
  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        token: credentialResponse.credential,
        action: 'login'
      });
 
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
 
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || t("Google Login Failed"));
    }
  };
 
  return (
    <div className="auth-container">
      <div className="auth-card split-layout">
 
        {/* Left Side: Manual Login */}
        <div className="auth-left">
          <h2 className="auth-title">{t("Welcome Back")}</h2>
          <p className="auth-subtitle">
            {t("Login Subtitle")}
          </p>
          {error && <p className="error-message">{error}</p>}
 
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label>{t("Email")}</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder={t("Placeholder Email")}
                required
              />
            </div>
 
            <div className="form-group">
              <label>{t("Password")}</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder={t("Placeholder Password")}
                required
              />
            </div>
 
            <button type="submit" className="btn-primary auth-btn">
              {t("Login")}
            </button>
          </form>
 
          <p className="auth-footer-text">
            {t("No Account")}{" "}
            <Link to="/register">{t("Register Here")}</Link>
          </p>
        </div>
 
        {/* Vertical Divider */}
        <div className="auth-divider">
          <span>{t("OR")}</span>
        </div>
 
        {/* Right Side: Google Auth */}
        <div className="auth-right">
          <h3 className="social-auth-title">{t("Google Sign In")}</h3>
          <p className="social-auth-subtitle">
            {t("Fast Secure")}
          </p>
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleAuth}
              onError={() => setError(t("Google Login Failed"))}
              useOneTap
              theme="filled_blue"
              shape="rectangular"
              size="large"
              text="signin_with"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
