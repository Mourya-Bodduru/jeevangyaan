import { useNavigate, Link } from "react-router-dom";
import "../styles/AuthHeader.css";
import jg from "../assets/jg.png";

const AuthHeader = () => {
  const navigate = useNavigate();

  return (
    <>
    <nav className="navbar auth-navbar">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>
        
      <div className="auth-center">
        <img src={jg} alt="JeevanGyaan Logo" />
        <span>JeevanGyaan</span>
      </div>

      <div className="btnspace">
       <Link to="/" className="home-btn">Home</Link> 
 
      </div>
    </nav>
    </>

  );
};

export default AuthHeader;
