import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/AiChat.css';

const AiChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const isLoggedIn = !!localStorage.getItem('token');
    const { t, i18n } = useTranslation();

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event) => {
                let fullTranscript = Array.from(event.results)
                    .map(result => result[0].transcript)
                    .join('');
                setInputValue(fullTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                if (event.error !== 'no-speech') {
                    setIsListening(false);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // Effect to update recognition language when i18n language changes
    useEffect(() => {
        if (recognitionRef.current) {
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
            recognitionRef.current.lang = langMap[i18n.language] || 'en-US';
        }
    }, [i18n.language]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                setInputValue('');
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.error("Failed to start recognition", e);
                }
            }
        }
    };

    const greetingMessage = {
        text: isLoggedIn ? t("Chat Greeting User") : t("Chat Greeting Guest"),
        sender: 'ai'
    };

    const [messages, setMessages] = useState([greetingMessage]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const messagesEndRef = useRef(null);

    // Load persisted chat history from server when the component mounts (logged-in users only)
    useEffect(() => {
        if (!isLoggedIn || historyLoaded) return;

        const loadHistory = async () => {
            try {
                const res = await api.get('/ai/chat-history');
                if (res.data.success && res.data.messages.length > 0) {
                    // Prepend greeting so it always appears first, then the real history
                    setMessages([greetingMessage, ...res.data.messages]);
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
            } finally {
                setHistoryLoaded(true);
            }
        };

        loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !isLoggedIn) return;

        const userMessage = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Prepare recent history for context (last 6 messages)
            const history = messages.slice(-6).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const res = await api.post('/ai/chat', {
                message: userMessage.text,
                history: history,
                lang: i18n.language
            });

            const aiMessage = { text: res.data.reply, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("AI Chat Error:", error);
            const errorMessage = {
                text: t("Chat Error"),
                sender: 'ai',
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`ai-chat-container ${isOpen ? 'open' : ''}`}>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    className="ai-chat-fab"
                    onClick={() => setIsOpen(true)}
                    title={t("Chat FAB Title")}
                >
                    <span className="fab-icon">🤖</span>
                </button>
            )}

            {/* Chat Window */}
            <div className={`ai-chat-window ${isOpen ? 'visible' : ''}`}>
                <div className="ai-chat-header">
                    <div className="header-info">
                        <span className="header-icon">🤖</span>
                        <h3>JeevanGuru</h3>
                    </div>
                    <button className="close-chat" onClick={() => setIsOpen(false)}>&times;</button>
                </div>

                <div className="ai-chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender} ${msg.isError ? 'error' : ''}`}>
                            <div className="message-content">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message ai typing">
                            <div className="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="ai-chat-input" onSubmit={handleSend} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={!recognitionRef.current || isLoading || !isLoggedIn}
                        style={{
                            background: isListening ? '#f44336' : 'white',
                            color: isListening ? 'white' : '#666',
                            border: '1px solid #ddd',
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '40px'
                        }}
                        title={t("Voice Input")}
                    >
                        {isListening ? '🔴' : '🎤'}
                    </button>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={isLoggedIn ? t("Chat Placeholder User") : t("Chat Placeholder Guest")}
                        disabled={isLoading || !isLoggedIn}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" disabled={isLoading || !inputValue.trim() || !isLoggedIn}>
                        {t("Chat Run")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AiChat;
