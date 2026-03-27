import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/Intro.css';

const Intro = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleVisit = () => {
        // Add a smooth exit animation class if needed before navigating
        const container = document.querySelector('.intro-container');
        container.classList.add('exit-animation');

        setTimeout(() => {
            navigate('/home');
        }, 800);
    };

    return (
        <div className="intro-container">
            {/* Background Video */}
            <div className="video-background">
                <iframe
                    src="https://www.youtube.com/embed/VkBnNxneA_A?autoplay=1&mute=1&controls=0&loop=1&playlist=VkBnNxneA_A&showinfo=0&rel=0&iv_load_policy=3&disablekb=1"
                    title="Background Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            {/* Gradient Overlays */}
            <div className="dark-overlay"></div>
            <div className="right-gradient-overlay"></div>
            <div className="left-bottom-gradient"></div>

            <div className="intro-content">
                <div className="intro-badge">JEEVANGYAAN</div>

                <h1 className="main-title">
                    <span className="white-text reveal-text">{t("Master Art")}</span>
                    <br />
                    <span className="highlight reveal-text">{t("Art Living")}</span>
                </h1>

                <p className="intro-quote">
                    {t("Intro Quote")}
                </p>

                <button className="visit-btn" onClick={handleVisit}>
                    {t("Visit Site")} <span className="btn-arrow">→</span>
                </button>
            </div>
        </div>
    );
};

export default Intro;
