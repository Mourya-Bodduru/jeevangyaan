import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import '../styles/Admin.css';
import '../styles/Login.css';

const ModuleForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        content: '',
        videoUrl: '',
        quiz: Array(5).fill(null).map(() => ({ question: '', options: ['', '', '', ''], correctAnswer: '' }))
    });
    const [imageFile, setImageFile] = useState(null);
    const [existingCategories, setExistingCategories] = useState([]);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);

            // Fetch all modules to extract existing categories
            const modulesRes = await api.get('/modules');
            const allModules = modulesRes.data.data || [];
            const uniqueCategories = [...new Set(allModules.map(m => m.category).filter(Boolean))];
            setExistingCategories(uniqueCategories);

            if (isEditMode) {
                const res = await api.get(`/modules/${id}`);
                const { title, description, category, content, videoUrl, quiz } = res.data.data;
                setFormData({
                    title,
                    description,
                    category,
                    content,
                    videoUrl: videoUrl || '',
                    quiz: (quiz && quiz.length > 0) ? quiz : Array(5).fill(null).map(() => ({ question: '', options: ['', '', '', ''], correctAnswer: '' }))
                });

                if (category && !uniqueCategories.includes(category)) {
                    setIsNewCategory(true);
                } else {
                    setIsNewCategory(false);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Failed to fetch module details or categories');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategorySelectChange = (e) => {
        const val = e.target.value;
        if (val === 'new') {
            setIsNewCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
        } else {
            setIsNewCategory(false);
            setFormData(prev => ({ ...prev, category: val }));
        }
    };

    const handleQuizChange = (index, field, value, optIndex = null) => {
        const newQuiz = [...formData.quiz];
        if (field === 'options') {
            newQuiz[index].options[optIndex] = value;
        } else {
            newQuiz[index][field] = value;
        }
        setFormData(prev => ({ ...prev, quiz: newQuiz }));
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('content', formData.content);
        data.append('videoUrl', formData.videoUrl);
        data.append('quiz', JSON.stringify(formData.quiz)); // Append quiz as JSON string
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            // Must remove Content-Type header to let browser set boundary for multipart
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (isEditMode) {
                await api.put(`/modules/${id}`, data, config);
            } else {
                await api.post('/modules', data, config);
            }
            navigate('/admin/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to save module');
            setLoading(false);
        }
    };

    if (loading && isEditMode) return <div className="loading-container">Loading...</div>;

    return (
        <div className="admin-container">
            <div className="form-container">
                <div className="form-header">
                    <h2>{isEditMode ? 'Edit Module' : 'Create New Module'}</h2>
                    <button onClick={() => navigate('/admin/dashboard')} className="btn-outline" style={{ marginTop: '10px' }}>
                        &larr; Back to Dashboard
                    </button>
                </div>

                {error && <p className="error-message">{error}</p>}

                <form className="auth-form" onSubmit={handleSubmit} encType="multipart/form-data">
                    <div className="form-group">
                        <label>Module Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Understanding Digital Footprint"
                        />
                    </div>

                    <div className="form-group">
                        <label>Category</label>
                        <select
                            value={isNewCategory ? 'new' : formData.category}
                            onChange={handleCategorySelectChange}
                            required={!isNewCategory}
                            className="form-control"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: isNewCategory ? '10px' : '0', backgroundColor: '#fff' }}
                        >
                            <option value="" disabled>Select a Category</option>
                            {existingCategories.map((cat, idx) => (
                                <option key={idx} value={cat}>{cat}</option>
                            ))}
                            <option value="new">+ Add New Category</option>
                        </select>

                        {isNewCategory && (
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                placeholder="Enter new category name (e.g., Digital Safety)"
                                style={{ marginTop: '10px' }}
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Module Image</label>
                        <input
                            type="file"
                            name="image"
                            onChange={handleFileChange}
                            accept="image/*"
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            placeholder="Brief summary of the module..."
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Content</label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            required
                            placeholder="Full content of the module (Markdown or HTML supported)..."
                            rows="10"
                        />
                    </div>

                    <div className="form-group">
                        <label>Video URL (YouTube)</label>
                        <input
                            type="url"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleChange}
                            placeholder="https://youtube.com/..."
                        />
                    </div>

                    {/* Quiz Builder Section */}
                    <div className="quiz-section" style={{ marginTop: '30px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
                        <h3>Quiz Builder (5 Questions)</h3>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Add 5 multiple-choice questions for this module.</p>

                        {formData.quiz.map((q, qIndex) => (
                            <div key={qIndex} className="quiz-question-card" style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
                                <h4>Question {qIndex + 1}</h4>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Enter question text"
                                        value={q.question}
                                        onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                    {q.options.map((opt, optIndex) => (
                                        <input
                                            key={optIndex}
                                            type="text"
                                            placeholder={`Option ${optIndex + 1}`}
                                            value={opt}
                                            onChange={(e) => handleQuizChange(qIndex, 'options', e.target.value, optIndex)}
                                            required
                                        />
                                    ))}
                                </div>
                                <div className="form-group">
                                    <label>Correct Answer</label>
                                    <select
                                        value={q.correctAnswer}
                                        onChange={(e) => handleQuizChange(qIndex, 'correctAnswer', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Correct Option</option>
                                        {q.options.map((opt, i) => (
                                            <option key={i} value={opt}>{opt || `Option ${i + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="btn-primary auth-btn" disabled={loading}>
                        {loading ? 'Saving...' : (isEditMode ? 'Update Module' : 'Create Module')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ModuleForm;
