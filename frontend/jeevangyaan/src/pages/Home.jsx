import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Home.css";

const Home = () => {
  const { t } = useTranslation();

  return (
    <>
      <section className="hero">
        <h1>
          {t("Master Life Skills")} <br />
          <span>{t("Real-World Success")}</span>
        </h1>

        <p>
          {t("Hero Desc")}
        </p>

        <div className="hero-buttons">
          <Link to="/login" className="btn-primary">
            {t("Start Learning")}
          </Link>
          <Link to="/modules" className="btn-outline">
            {t("View All Modules")}
          </Link>
        </div>
      </section>

      <section className="features">
        <h2>
          {t("Why Choose")} <span>JeevanGyaan?</span>
        </h2>

        <div className="feature-cards">
          <div className="card">
            <h3>📘 {t("Interactive Modules")}</h3>
            <p>{t("Interactive Desc")}</p>
          </div>

          <div className="card">
            <h3>✨ {t("AI Stories")}</h3>
            <p>{t("AI Desc")}</p>
          </div>

          <div className="card">
            <h3>🤖 {t("AI Assistant Hub")}</h3>
            <p>{t("AI Assistant Desc")}</p>
          </div>
 
          <div className="card">
            <h3>📊 {t("Track Progress")}</h3>
            <p>{t("Track Desc")}</p>
          </div>
 
          <div className="card">
            <h3>{t("Essential Topics")}</h3>
            <p>{t("Essential Desc")}</p>
          </div>
          <div className="card">
            <h3>🏆 {t("Leaderboard")}</h3>
            <p>{t("Motivational Rank")}</p>
          </div>
 
          <div className="card">
            <h3>📚 {t("NEP 2020")}</h3>
            <p>{t("NEP Desc")}</p>
          </div>
        </div>
      </section>
 
      <section className="call-to-action">
        <div className="cta-content">
          <h2>{t("Ready Transform")}</h2>
          <p>{t("Join Journey")}</p>
          <Link to="/register" className="btn-action">
            {t("Get Started Now")}
          </Link>
        </div>
      </section>
    </>
  );
};

export default Home;
