import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import BoyModel3D from '../components/BoyModel3D';
import '../styles/ScenarioSimulator.css';

const ScenarioSimulator = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [scenario, setScenario] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mouthSignal, setMouthSignal] = useState(0); // 0-1 lip-sync value for 3D model
    const [turnCount, setTurnCount] = useState(0);
    const [isEvaluated, setIsEvaluated] = useState(false);
    const [evaluationResult, setEvaluationResult] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                // Auto-send when speech is completely recognized
                setTimeout(() => handleSendMessage(transcript), 500);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setInputText('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize the AI conversation when the component loads or scenario changes
    useEffect(() => {
        setMessages([]);
        setInputText('');
        window.speechSynthesis?.cancel();
        setIsAiSpeaking(false);
        setTurnCount(0);
        setIsEvaluated(false);
        setEvaluationResult('');

        if (!scenario) return;

        let isMounted = true;

        const initScenario = async () => {
            setIsLoading(true);
            try {
                const res = await api.post('/scenarios/simulate', {
                    message: "START_SCENARIO_NOW",
                    history: [],
                    scenario: scenario,
                    lang: i18n.language
                });
                if (isMounted) {
                    const aiMsg = { text: res.data.reply, sender: 'ai' };
                    setMessages([aiMsg]);
                    speakWithBrowserTTS(aiMsg.text);
                }
            } catch (err) {
                console.error("Failed to initialize scenario", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        // Small delay to let the UI render first
        setTimeout(initScenario, 500);

        return () => {
            isMounted = false;
        };
    }, [scenario, i18n.language, refreshKey]);

    const speakWithBrowserTTS = (text) => {
        if (!window.speechSynthesis) return;

        // Strip markdown and emojis for TTS
        const cleanText = text.replace(/[^\w\s\.,!?']/g, '');

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Slightly higher pitch for a young boy
        utterance.pitch = 1.3;

        // Try to find a young boy voice
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;

        if (i18n.language === 'hi') {
            utterance.lang = 'hi-IN';
            selectedVoice = voices.find(v => v.lang.includes('hi') && (v.name.includes('Male') || v.name.includes('Ravi')));
        } else if (i18n.language === 'te') {
            utterance.lang = 'te-IN';
            selectedVoice = voices.find(v => v.lang.includes('te') && v.name.includes('Male'));
        } else {
            utterance.lang = 'en-US';
            selectedVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('David') || v.name.includes('Mark') || v.name.includes('Male')));
        }

        if (selectedVoice) utterance.voice = selectedVoice;

        // ── Lip-sync: each word boundary triggers a mouth-open pulse ─────────
        let boundaryTimer = null;
        utterance.onboundary = (e) => {
            if (e.name === 'word') {
                // Open mouth
                setMouthSignal(0.75 + Math.random() * 0.25);
                // Close after ~200ms then reopen briefly
                clearTimeout(boundaryTimer);
                boundaryTimer = setTimeout(() => setMouthSignal(0.1), 200);
            }
        };

        utterance.onstart = () => { setIsAiSpeaking(true); setMouthSignal(0.5); };
        utterance.onend   = () => { setIsAiSpeaking(false); setMouthSignal(0); clearTimeout(boundaryTimer); };
        utterance.onerror = () => { setIsAiSpeaking(false); setMouthSignal(0); clearTimeout(boundaryTimer); };

        window.speechSynthesis.speak(utterance);
    };

    const handleEvaluateScenario = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const formattedHistory = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const res = await api.post('/scenarios/evaluate', {
                history: formattedHistory,
                lang: i18n.language
            });

            setIsEvaluated(true);
            setEvaluationResult(res.data.reply);
            
            setMessages(prev => [...prev, { text: "Session ended. I have reviewed your performance, please check the feedback below.", sender: 'ai' }]);
            speakWithBrowserTTS("Session ended. I have reviewed your performance, please check the feedback below.");

        } catch (err) {
            console.error("Evaluation Error:", err);
            setMessages(prev => [...prev, { text: "Sorry, I couldn't evaluate this session. Please try again.", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (textOverride = null) => {
        const textToSend = typeof textOverride === 'string' ? textOverride : inputText;
        if (!textToSend.trim() || isLoading) return;

        const userMsg = { text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            // Get User name
            const user = JSON.parse(localStorage.getItem('user'));
            const userName = user?.name || 'Friend';

            // Format history for Gemini
            const formattedHistory = messages.map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const res = await api.post('/scenarios/simulate', {
                message: textToSend,
                history: formattedHistory,
                scenario: scenario,
                lang: i18n.language,
                userName: userName
            });

            const aiMsg = { text: res.data.reply, sender: 'ai' };
            setMessages(prev => [...prev, aiMsg]);
            setTurnCount(prev => prev + 1);

            // Trigger 3D Avatar talking animation and TTS
            speakWithBrowserTTS(aiMsg.text);

        } catch (err) {
            console.error("Scenario Error:", err);
            setMessages(prev => [...prev, { text: "Sorry, I lost my connection! Can we try again?", sender: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="scenario-simulator-container">
            {/* Header */}
            <div className="simulator-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    &larr; Back to Dashboard
                </button>
                <div className="scenario-selector">
                    <label>🎬 Scenario: </label>
                    <select value={scenario} onChange={(e) => {
                        setScenario(e.target.value);
                    }}>
                        <option value="" disabled>Select a Scenario...</option>
                        <option value="otp_scam">OTP Scam Call from Bank</option>
                        <option value="fake_job">Fake Job / Internship Offer</option>
                        <option value="cyberbullying">Cyberbullying on Social Media</option>
                        <option value="lost_wallet">Lost Wallet in Public Place</option>
                        <option value="peer_pressure">Peer Pressure to Try Smoking or Drinking</option>
                    </select>
                </div>
            </div>

            <div className="simulator-content">
                {/* 3D Boy Model */}
                <BoyModel3D isSpeaking={isAiSpeaking} mouthSignal={mouthSignal} />

                {/* Chat Interface Area */}
                <div className="chat-interface">
                    {scenario ? (
                        <>
                            <div className="chat-messages">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`chat-line ${msg.sender}`}>
                                        <div className="chat-bubble">
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="chat-line ai">
                                        <div className="chat-bubble typing">...thinking...</div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {!isEvaluated ? (
                                <div className="chat-input-area" style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className={`mic-btn ${isListening ? 'listening' : ''}`}
                                        onClick={toggleListening}
                                        title="Speak"
                                    >
                                        {isListening ? '🛑' : '🎤'}
                                    </button>
                                    <input
                                        type="text"
                                        style={{ flex: 1 }}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type or speak your response..."
                                        disabled={isLoading}
                                    />
                                    <button
                                        className="send-btn"
                                        onClick={() => handleSendMessage()}
                                        disabled={isLoading || !inputText.trim()}
                                    >
                                        Send
                                    </button>

                                    {turnCount >= 5 && (
                                        <button
                                            className="eval-btn"
                                            onClick={handleEvaluateScenario}
                                            disabled={isLoading}
                                            style={{ padding: '0 20px', backgroundColor: '#ffd700', color: '#000', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Finish & Evaluate
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="evaluation-result-area" style={{ padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '15px', marginTop: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ marginTop: 0, color: '#4f46e5' }}>📊 AI Feedback</h3>
                                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', marginBottom: '20px', color: '#333' }}>
                                        {evaluationResult}
                                    </div>
                                    <button onClick={() => setRefreshKey(prev => prev + 1)} className="send-btn" style={{ width: '100%', padding: '12px' }}>Start Over</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="chat-messages empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
                            <p style={{ color: '#888', fontStyle: 'italic', fontSize: '1.2rem' }}>Please select a scenario from the dropdown above to begin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScenarioSimulator;
