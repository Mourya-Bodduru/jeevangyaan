import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSelector.css';

const LanguageSelector = () => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    // Only Indian languages are listed
    const languages = useMemo(() => [
        { code: 'en', name: 'English',   native: 'English' },
        { code: 'hi', name: 'Hindi',     native: 'हिंदी' },
        { code: 'te', name: 'Telugu',    native: 'తెలుగు' },
        { code: 'ta', name: 'Tamil',     native: 'தமிழ்' },
        { code: 'mr', name: 'Marathi',   native: 'मराठी' },
        { code: 'bn', name: 'Bengali',   native: 'বাংলা' },
        { code: 'gu', name: 'Gujarati',  native: 'ગુજરાતી' },
        { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ' },
        { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
        { code: 'pa', name: 'Punjabi',   native: 'ਪੰਜਾਬੀ' },
        { code: 'ur', name: 'Urdu',      native: 'اردو' },
        { code: 'or', name: 'Odia',      native: 'ଓଡ଼ିଆ' },
        { code: 'sa', name: 'Sanskrit',  native: 'संस्कृतम्' },
        { code: 'ne', name: 'Nepali',    native: 'नेपाली' },
        { code: 'ks', name: 'Kashmiri',  native: 'کأشُر' },
        { code: 'gom', name: 'Konkani',  native: 'कोंकणी' },
        { code: 'as', name: 'Assamese',  native: 'অসমীয়া' },
    ], []);

    const popularLanguages = ['en', 'hi', 'te', 'ta', 'mr', 'bn', 'gu', 'kn', 'ml'];

    const handleSelectLanguage = (lang) => {
        i18n.changeLanguage(lang);
        localStorage.setItem('i18nextLng', lang);
        navigate('/intro');
    };

    const filteredLanguages = languages.filter(lang =>
        lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.native.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="ls-page-container">
            <div className="ls-aura-background"></div>

            <div className="ls-content-wrapper">
                <header className="ls-header">
                    <h1 className="ls-title">Select Your Language</h1>
                    <p className="ls-subtitle">Choose your preferred Indian language to start your JeevanGyaan journey</p>

                    <div className="ls-search-container">
                        <input
                            type="text"
                            placeholder="Search language..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ls-search-input"
                        />
                        <span className="ls-search-icon">🔍</span>
                    </div>
                </header>

                <main className="ls-main">
                    {!searchTerm && (
                        <section className="ls-section">
                            <h2 className="ls-section-title">Popular Languages</h2>
                            <div className="ls-grid">
                                {languages.filter(l => popularLanguages.includes(l.code)).map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleSelectLanguage(lang.code)}
                                        className={`ls-card ${i18n.language === lang.code ? 'active' : ''}`}
                                    >
                                        <span className="ls-lang-native">{lang.native}</span>
                                        <span className="ls-lang-name">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="ls-section">
                        <h2 className="ls-section-title">
                            {searchTerm ? `Search Results (${filteredLanguages.length})` : 'All Indian Languages'}
                        </h2>
                        <div className="ls-grid">
                            {filteredLanguages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleSelectLanguage(lang.code)}
                                    className={`ls-card ls-card-small ${i18n.language === lang.code ? 'active' : ''}`}
                                >
                                    <span className="ls-lang-native">{lang.native}</span>
                                    <span className="ls-lang-name">{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default LanguageSelector;
