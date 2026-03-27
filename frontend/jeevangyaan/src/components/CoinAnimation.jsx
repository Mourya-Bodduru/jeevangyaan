import React from 'react';
import '../styles/CoinAnimation.css';

const CoinAnimation = ({ onComplete }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3000); // Animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="coin-animation-overlay">
            <div className="coin-animation-content">
                <div className="spinning-coin">🪙</div>
                <h2 className="coin-text">You won 1 coin!</h2>
                <div className="stars-container">
                    <span className="star">✨</span>
                    <span className="star">⭐</span>
                    <span className="star">✨</span>
                </div>
            </div>
        </div>
    );
};

export default CoinAnimation;
