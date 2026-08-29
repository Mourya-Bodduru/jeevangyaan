import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import '../styles/Admin.css';
import ConfirmModal from '../components/ConfirmModal';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ users: 0, modules: 0, requests: 0 });
    const [modules, setModules] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('modules'); // 'modules' or 'requests'
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyStatus, setReplyStatus] = useState({ type: '', text: '' });
    // Delete confirmation modal state
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, moduleId: null, moduleName: '' });
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [analyticsRes, modulesRes, requestsRes] = await Promise.all([
                api.get('/admin/analytics'),
                api.get('/modules'),
                api.get('/requests')
            ]);

            setStats({ ...analyticsRes.data.data, requests: requestsRes.data.data.length });
            setModules(modulesRes.data.data);
            setRequests(requestsRes.data.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch dashboard data. Make sure you are an admin.');
            setLoading(false);
            // Optional: redirect if 403
            if (err.response && err.response.status === 403) {
                navigate('/');
            }
        }
    };

    const openDeleteModal = (id, name) => {
        setDeleteModal({ isOpen: true, moduleId: id, moduleName: name });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, moduleId: null, moduleName: '' });
    };

    const confirmDelete = async () => {
        const { moduleId } = deleteModal;
        closeDeleteModal();
        try {
            await api.delete(`/modules/${moduleId}`);
            setModules(modules.filter(m => m._id !== moduleId));
            setStats(prev => ({ ...prev, modules: prev.modules - 1 }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        setReplyStatus({ type: '', text: '' });

        try {
            await api.post(`/requests/${selectedRequest._id}/reply`, { replyMessage });
            setReplyStatus({ type: 'success', text: 'Reply sent successfully!' });
            setRequests(requests.filter(r => r._id !== selectedRequest._id));
            setStats({ ...stats, requests: stats.requests - 1 });
            setTimeout(() => {
                setShowReplyModal(false);
                setReplyMessage('');
                setSelectedRequest(null);
                setReplyStatus({ type: '', text: '' });
            }, 2000);
        } catch (err) {
            setReplyStatus({ type: 'error', text: err.response?.data?.message || 'Failed to send reply' });
        }
    };

    // Get unique categories and their counts
    const categories = modules.reduce((acc, module) => {
        const cat = module.category || 'Uncategorized';
        if (!acc[cat]) {
            acc[cat] = 0;
        }
        acc[cat]++;
        return acc;
    }, {});

    const filteredModules = selectedCategory
        ? modules.filter(m => (m.category || 'Uncategorized') === selectedCategory)
        : [];

    // Helper to get category icon
    const getCategoryIcon = (category) => {
        const icons = {
            'Science': '🔬',
            'Mathematics': '📐',
            'History': '📜',
            'Technology': '💻',
            'Art': '🎨',
            'Literature': '📚',
            'Geography': '🌍',
            'Music': '🎵',
            'Health': '🏥',
            'Sports': '⚽',
            'Uncategorized': '📦'
        };
        return icons[category] || '📑';
    };

    if (loading) return <div className="loading-container">Loading Dashboard...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <Link to="/admin/module/new" className="btn-primary">
                    + Create New Module
                </Link>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <div className="stat-value">{stats.users}</div>
                </div>
                <div className="stat-card">
                    <h3>Total Modules</h3>
                    <div className="stat-value">{stats.modules}</div>
                </div>
                <div className="stat-card">
                    <h3>Total Requests</h3>
                    <div className="stat-value">{stats.requests || requests.length}</div>
                </div>
            </div>

            <div className="admin-tabs" style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <button
                    className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('modules')}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: activeTab === 'modules' ? 'bold' : 'normal', color: activeTab === 'modules' ? '#4f46e5' : '#666', cursor: 'pointer' }}
                >
                    Modules Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: activeTab === 'requests' ? 'bold' : 'normal', color: activeTab === 'requests' ? '#4f46e5' : '#666', cursor: 'pointer' }}
                >
                    User Requests {requests.length > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 8px', fontSize: '0.9rem', marginLeft: '8px' }}>{requests.length}</span>}
                </button>
            </div>

            {activeTab === 'modules' ? (
                <div className="modules-section">
                    <div className="modules-section-header">
                        <h3>{selectedCategory ? `Modules in "${selectedCategory}"` : 'Module Categories'}</h3>
                        {selectedCategory && (
                            <button onClick={() => setSelectedCategory(null)} className="btn-outline">
                                &larr; Back to Categories
                            </button>
                        )}
                    </div>

                    {!selectedCategory ? (
                        // Category View
                        <div className="category-grid">
                            {Object.keys(categories).length > 0 ? (
                                Object.entries(categories).map(([category, count]) => (
                                    <div
                                        key={category}
                                        className="category-card"
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        <div className="category-icon">{getCategoryIcon(category)}</div>
                                        <h4>{category}</h4>
                                        <p>{count} Modules</p>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', width: '100%', padding: '20px' }}>
                                    No modules found. Create one to get started!
                                </p>
                            )}
                        </div>
                    ) : (
                        // Module List View (Filtered)
                        <div className="admin-modules-grid">
                            {filteredModules.map((module) => (
                                <div key={module._id} className="admin-module-card">
                                    <div className="admin-card-image">
                                        {module.image ? (
                                            <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${module.image}`} alt={module.title} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No Image</div>
                                        )}
                                    </div>
                                    <div className="admin-card-content">
                                        <h4>{module.title}</h4>
                                        {/* Category tag removed as we are already in category view, or keep for clarity */}
                                        <span className="category-tag" style={{ alignSelf: 'flex-start', marginBottom: '10px' }}>{module.category}</span>
                                        <p className="admin-card-date">Created: {new Date(module.createdAt).toLocaleDateString()}</p>
                                        <div className="admin-card-actions">
                                            <Link to={`/admin/module/edit/${module._id}`} className="btn-edit">
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => openDeleteModal(module._id, module.title)}
                                                className="btn-delete"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="requests-section">
                    <div className="modules-section-header">
                        <h3>User Queries and Requests</h3>
                    </div>

                    {requests.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
                            No pending requests at the moment.
                        </p>
                    ) : (
                        <div className="admin-modules-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                            {requests.map((req) => (
                                <div key={req._id} className="admin-module-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ paddingBottom: '15px', borderBottom: '1px solid #eee', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h4 style={{ margin: 0, color: '#1f2937' }}>{req.userId?.username || 'Unknown User'}</h4>
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '12px' }}>
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ margin: '5px 0 0', fontSize: '0.9rem', color: '#6b7280' }}>{req.userEmail}</p>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563' }}>Query Info:</strong>
                                            <p style={{ margin: '4px 0', fontSize: '0.95rem' }}>{req.queryInfo}</p>
                                        </div>
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563' }}>Reason:</strong>
                                            <p style={{ margin: '4px 0', fontSize: '0.95rem', color: '#4b5563' }}>{req.reason}</p>
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <strong style={{ display: 'block', fontSize: '0.9rem', color: '#4b5563' }}>Required Things:</strong>
                                            <p style={{ margin: '4px 0', fontSize: '0.95rem', color: '#4b5563' }}>{req.requiredThings}</p>
                                        </div>
                                    </div>

                                    <button
                                        className="btn-primary"
                                        style={{ width: '100%', marginTop: 'auto' }}
                                        onClick={() => {
                                            setSelectedRequest(req);
                                            setShowReplyModal(true);
                                        }}
                                    >
                                        ✉️ Reply via Email
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                title="Delete Module?"
                message={<>Are you sure you want to delete <strong>&ldquo;{deleteModal.moduleName}&rdquo;</strong>? This action cannot be undone.</>}
                confirmText="Yes, Delete"
                cancelText="Keep It"
                variant="danger"
                icon="🗑️"
                onConfirm={confirmDelete}
                onCancel={closeDeleteModal}
            />

            {/* Reply Modal */}
            {showReplyModal && selectedRequest && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal" style={{ maxWidth: '600px' }}>
                        <button className="close-modal-btn" onClick={() => {
                            setShowReplyModal(false);
                            setReplyStatus({ type: '', text: '' });
                            setReplyMessage('');
                        }}>&times;</button>

                        <div className="modal-header" style={{ alignItems: 'flex-start', textAlign: 'left', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                            <h3>Reply to {selectedRequest.userId?.username}'s Request</h3>
                            <p style={{ margin: '5px 0 0' }}>Replying to: <strong>{selectedRequest.userEmail}</strong></p>
                        </div>

                        <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            <strong style={{ display: 'block', marginBottom: '5px' }}>Original Query:</strong>
                            <p style={{ margin: 0, fontStyle: 'italic', color: '#4b5563' }}>"{selectedRequest.queryInfo}"</p>
                        </div>

                        <div className="password-change-section">
                            {replyStatus.text && (
                                <div className={`message-alert ${replyStatus.type}`}>
                                    {replyStatus.text}
                                </div>
                            )}
                            <form onSubmit={handleReplySubmit}>
                                <div className="form-group">
                                    <label>Your Reply Message</label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        required
                                        rows="6"
                                        placeholder="Type your response here... This will be sent directly to the user's email."
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setShowReplyModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>Send Email & Resolve</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
