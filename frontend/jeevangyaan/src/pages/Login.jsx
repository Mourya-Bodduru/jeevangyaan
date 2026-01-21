import { Link } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">
          Login to continue your Jeevan Gyaan journey
        </p>

        <form className="auth-form">
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-btn">
            Login
          </button>
        </form>

        <p className="auth-footer-text">
          Don’t have an account?{" "}
          <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
