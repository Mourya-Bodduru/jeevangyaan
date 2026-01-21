import { Link } from "react-router-dom";
import "../styles/Header.css";
import jg from "../assets/jg.png";

const Header = () => {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <img src={jg} alt="JeevanGyaan Logo" />
        <span>JeevanGyaan</span>
      </div>

      <div className="nav-right">
        <Link to="/login" className="btn-outline">
          Login
        </Link>
        <Link to="/register" className="btn-primary">
          Get Started
        </Link>
      </div>
    </nav>
  );
};

export default Header;
