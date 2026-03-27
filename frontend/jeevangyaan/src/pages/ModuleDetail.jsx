import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import Markdown from 'markdown-to-jsx';
import html2pdf from 'html2pdf.js';
import ChallengeUpload from '../components/ChallengeUpload';
import CoinAnimation from '../components/CoinAnimation';
import '../styles/ModuleDetail.css';

const ModuleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const videoSectionRef = useRef(null);
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storyLoading, setStoryLoading] = useState(false);
    const [story, setStory] = useState(null);
    const [error, setError] = useState('');
    const [isCompleted, setIsCompleted] = useState(false); // New state for completion status
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showCoinAnimation, setShowCoinAnimation] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const { t, i18n } = useTranslation();

    // Function to handle custom fullscreen
    const toggleFullscreen = () => {
        if (!videoSectionRef.current) return;

        if (!document.fullscreenElement) {
            videoSectionRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Effect to track fullscreen changes (e.g., when user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Function to fetch module details
    const fetchModule = async () => {
        try {
            const res = await api.get(`/modules/${id}?lang=${i18n.language}`);
            setModule(res.data.data);
            if (res.data.data.aiStory) {
                setStory(res.data.data.aiStory);
            }
            setLoading(false);
        } catch (err) {
            setError(t("Load Module Error") || 'Failed to load module details');
            setLoading(false);
        }
    };
 
    // Function to check completion status
    const checkCompletionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const res = await api.get(`/progress/status/${id}`, config);
            setIsCompleted(res.data.isCompleted);
        } catch (err) {
            console.error("Failed to check completion status", err);
            // Optionally handle error, but don't block module loading
        }
    };
 
    useEffect(() => {
        fetchModule();
        checkCompletionStatus();
 
        // Cleanup speech synthesis on unmount
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [id]);
 
    const handleSpeak = () => {
        if (!story || !window.speechSynthesis) return;
 
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
 
        // Strip markdown characters before speaking
        const plainText = story.replace(/[#*`_~>\[\]\(\)]/g, '');
 
        const utterance = new SpeechSynthesisUtterance(plainText);
        const langMap = {
            'hi': 'hi-IN',
            'te': 'te-IN',
            'ta': 'ta-IN',
            'mr': 'mr-IN',
            'bn': 'bn-IN',
            'gu': 'gu-IN',
            'kn': 'kn-IN',
            'ml': 'ml-IN',
            'pa': 'pa-IN',
            'ur': 'ur-IN',
            'or': 'or-IN',
            'sa': 'sa-IN',
            'ne': 'ne-NP',
            'ks': 'ks-IN',
            'gom': 'gom-IN',
            'as': 'as-IN'
        };
        utterance.lang = langMap[i18n.language] || 'en-US';
 
        utterance.onend = () => {
            setIsSpeaking(false);
        };
 
        utterance.onerror = () => {
            setIsSpeaking(false);
        };
 
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };
 
    const handleDownloadPdf = () => {
        if (!story) return;
 
        const element = document.createElement('div');
        element.innerHTML = `
            <div style="padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px;">
                    <h1 style="color: #6366f1; margin: 0; font-size: 28px;">JeevanGyaan</h1>
                    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">${t("Storybook Subtitle")}</p>
                </div>
                <div style="line-height: 1.6; font-size: 16px;">
                    ${document.querySelector('.story-content').innerHTML}
                </div>
                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    ${t("Generated By")}
                </div>
            </div>
        `;
 
        const opt = {
            margin: 10,
            filename: `${module.title.replace(/\s+/g, '_')}_Story.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
 
        html2pdf().set(opt).from(element).save();
    };
 
    const handleGenerateStory = async () => {
        setStoryLoading(true);
        setStory(null); // Clear previous story when generating a new one
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const res = await api.post(`/modules/${id}/story?lang=${i18n.language}`, {}, config);
            setStory(res.data.data);
 
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.details || err.response?.data?.error || t("Generate Story Error") || 'Failed to generate story. Please try again.';
            alert(errorMessage);
        } finally {
            setStoryLoading(false);
        }
    };
 
    const handleMarkComplete = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            const res = await api.post('/progress/mark-complete', { moduleId: id }, config);
            setIsCompleted(true);
            
            if (res.data.coinAwarded) {
                setShowCoinAnimation(true);
                // Update local storage user data
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData) {
                    userData.coins = res.data.totalCoins;
                    localStorage.setItem('user', JSON.stringify(userData));
                    // Dispatch storage event so other components (like Dashboard) update if they are listening
                    window.dispatchEvent(new Event('storage'));
                }
            } else {
                alert(t("Module Marked Complete") || "Module marked as completed! 🎉");
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data?.details || err.response?.data?.error || t("Mark Complete Error") || 'Failed to mark as complete. Please try again.';
            alert(errorMessage);
        }
    };
 
    if (loading) return <div className="loading-container">{t("Loading Module")}</div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!module) return <div className="error-container">{t("Module Not Found")}</div>;
 
    // Helper to extract YouTube ID
    const getYoutubeEmbedUrl = (url) => {
        if (!url) return null;
        let videoId = '';
        // Handle standard youtube.com/watch?v= format
        if (url.includes('v=')) {
            videoId = url.split('v=')[1].split('&')[0];
        }
        // Handle youtu.be shortlinks
        else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }
 
        // Hide ALL YouTube player chrome:
        // controls=0       → hide play bar, volume, fullscreen, settings
        // modestbranding=1 → hide YouTube logo
        // showinfo=0       → hide video title and uploader (legacy, still honoured on some players)
        // rel=0            → no related video end-screen
        // iv_load_policy=3 → hide annotations / cards
        // disablekb=1      → disable keyboard shortcuts
        // fs=0             → hide native fullscreen button
        // playsinline=1    → stay in-page on mobile
        return videoId
            ? `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=0&fs=0&playsinline=1&enablejsapi=1`
            : null;
    };
 
    const videoEmbedUrl = getYoutubeEmbedUrl(module.videoUrl);
 
    return (
        <div className="module-detail-container">
            {showCoinAnimation && <CoinAnimation onComplete={() => setShowCoinAnimation(false)} />}
            <div className="back-btn-container">
                <button onClick={() => navigate(-1)} className="btn-outline">
                    &larr; {t("Back")}
                </button>
            </div>
 
            <div className="module-header">
                <h1>{module.title}</h1>
                <span className="category-badge">{module.category}</span>
            </div>
 
            <div className="module-content-wrapper">
                {module.image && (
                    <div className="module-banner-image" style={{ marginBottom: '30px', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px' }}>
                        <img src={`http://localhost:8000${module.image}`} alt={module.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
 
                {videoEmbedUrl && (
                    <div className="video-section" ref={videoSectionRef} onContextMenu={(e) => e.preventDefault()}>
                        <div className="video-cropper">
                            <iframe
                                src={videoEmbedUrl}
                                title={module.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                        </div>
                        {/* Custom Fullscreen Toggle */}
                        <button className="custom-fullscreen-btn" onClick={toggleFullscreen}>
                            {isFullscreen ? '⏹' : '⛶'}
                        </button>
                        {/* Overlay to hide YouTube title/channel/share info */}
                        <div className="video-overlay"></div>
                        {/* Overlay to block 'Watch on YouTube' link in the bottom right */}
                        <div className="video-bottom-overlay"></div>
                    </div>
                )}
 
                <div className="text-content">
                    <h3>{t("Description")}</h3>
                    <p>{module.description}</p>
                    <h3>{t("Content")}</h3>
                    <div className="content-body">
                        {module.content}
                    </div>
                </div>
 
                {/* Action Buttons Section */}
                <div className="action-buttons">
                    <button
                        onClick={handleMarkComplete}
                        className={`mark-complete-btn ${isCompleted ? 'completed' : ''}`}
                        disabled={isCompleted}
                    >
                        {isCompleted ? `✅ ${t("Completed")}` : t("Mark Complete")}
                    </button>
                </div>
 
                {/* AI Story Section */}
                <div className="ai-story-section" style={{ marginTop: '40px', padding: '20px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ✨ {t("AI Story Analogy")}
                        </h3>
                        {!story && (
                            <button
                                onClick={handleGenerateStory}
                                disabled={storyLoading}
                                className="generate-story-btn"
                                style={{
                                    padding: '8px 16px',
                                    background: storyLoading ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: storyLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                {storyLoading ? t("Generating") : t("Generate Story")}
                            </button>
                        )}
                        {story && (
                            <button
                                onClick={handleSpeak}
                                style={{
                                    padding: '8px 16px',
                                    background: isSpeaking ? '#f43f5e' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                title={isSpeaking ? t("Stop Reading") : t("Read Aloud")}
                            >
                                {isSpeaking ? `⏹ ${t("Stop Reading")}` : `🔊 ${t("Read Aloud")}`}
                            </button>
                        )}
                        {story && (
                            <button
                                onClick={handleDownloadPdf}
                                style={{
                                    padding: '8px 16px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                title={t("PDF Export")}
                            >
                                📥 {t("PDF Export")}
                            </button>
                        )}
                    </div>
 
                    {story ? (
                        <div className="story-content">
                            <Markdown>{story}</Markdown>
                        </div>
                    ) : (
                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                            {t("Click Generate")}
                        </p>
                    )}
                </div>
 
                {/* Real World Action Tracker Section */}
                <ChallengeUpload moduleId={id} />

                {/* Quiz CTA Section */}
                <div className="quiz-cta-section" style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate(`/modules/${id}/quiz`)}
                        className="btn-primary"
                        style={{
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                            padding: '12px 25px',
                            fontSize: '1.1rem'
                        }}
                    >
                        📝 {t("Take Quiz")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModuleDetail;
