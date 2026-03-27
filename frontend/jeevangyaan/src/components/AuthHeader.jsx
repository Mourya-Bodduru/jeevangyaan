import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/AuthHeader.css";
import jg from "../assets/jg.png";

const AuthHeader = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <nav className="navbar auth-navbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t("Back")}
        </button>

        <div className="auth-center">
          <img src={jg} alt="JeevanGyaan Logo" />
          <span>JeevanGyaan</span>
        </div>

        <div className="btnspace">
          <Link to="/home" className="home-btn">{t("Home")}</Link>

        </div>
      </nav>
    </>

  );
};

export default AuthHeader;
