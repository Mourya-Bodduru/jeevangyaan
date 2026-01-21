import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>JeevanGyaan</h3>
          <p>Life skills beyond textbooks</p>
        </div>

        <div className="footer-links">
          <a href="/">Home</a>
          <a href="/modules">Modules</a>
          <a href="/login">Login</a>
          <a href="/register">Register</a>
        </div>

        <div className="footer-extra">
          <p>Empowering responsible citizens</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 JeevanGyaan. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
