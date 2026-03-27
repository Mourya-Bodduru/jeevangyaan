import { useTranslation } from "react-i18next";
import "../styles/Footer.css";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>JeevanGyaan</h3>
          <p>{t("Life skills beyond")}</p>
        </div>
        <div className="footer-links">
          <a href="/home">{t("Home")}</a>
          <a href="/modules">{t("Modules")}</a>
          <a href="/login">{t("Login")}</a>
          <a href="/register">{t("Register")}</a>
        </div>
        <div className="footer-extra">
          <p>{t("Empowering citizens")}</p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
