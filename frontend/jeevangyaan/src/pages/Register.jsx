import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from '@react-oauth/google';
import api from "../api";
import "../styles/Login.css"; // reuse same styles

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { username, email, password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t("Passwords Not Match"));
      return;
    }
 
    try {
      const res = await api.post('/auth/register', { username, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration Error:', err);
      if (err.response) {
        console.error('Error Data:', err.response.data);
        console.error('Error Status:', err.response.status);
      }
      setError(err.response?.data?.error || err.message || t("Registration Failed"));
    }
  };
 
  const handleGoogleAuth = async (credentialResponse) => {
    try {
      const res = await api.post('/auth/google', {
        token: credentialResponse.credential,
        action: 'register'
      });
 
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
 
      if (res.data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || t("Google Reg Failed"));
    }
  };
 
  return (
    <div className="auth-container">
      <div className="auth-card split-layout">
 
        {/* Left Side: Manual Register */}
        <div className="auth-left">
          <h2 className="auth-title">{t("Create Account")}</h2>
          <p className="auth-subtitle">
            {t("Register Subtitle")}
          </p>
          {error && <p className="error-message">{error}</p>}
 
          <form className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label>{t("User Name")}</label>
              <input
                type="text"
                name="username"
                value={username}
                onChange={onChange}
                placeholder={t("Placeholder Full Name")}
                required
              />
            </div>
 
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
                placeholder={t("Placeholder Create Password")}
                required
              />
            </div>
 
            <div className="form-group">
              <label>{t("Confirm Password")}</label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                placeholder={t("Placeholder Confirm Password")}
                required
              />
            </div>
 
            <button type="submit" className="btn-primary auth-btn">
              {t("Register")}
            </button>
          </form>
 
          <p className="auth-footer-text">
            {t("Already Account")}{" "}
            <Link to="/login">{t("Login Here")}</Link>
          </p>
        </div>
 
        {/* Vertical Divider */}
        <div className="auth-divider">
          <span>{t("OR")}</span>
        </div>
 
        {/* Right Side: Google Auth */}
        <div className="auth-right">
          <h3 className="social-auth-title">{t("Google Sign Up")}</h3>
          <p className="social-auth-subtitle">
            {t("Fast Secure")}
          </p>
          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleAuth}
              onError={() => setError(t("Google Reg Failed"))}
              useOneTap
              theme="filled_blue"
              shape="rectangular"
              size="large"
              text="signup_with"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
