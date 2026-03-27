import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import '../styles/Community.css';

const Community = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showPostForm, setShowPostForm] = useState(false);
    const [activeComments, setActiveComments] = useState({}); // { postId: comments[] }
    const [newComments, setNewComments] = useState({}); // { postId: '' }

    const [expandedDates, setExpandedDates] = useState({}); // { 'March 15, 2026': true }

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (!user?.communityJoined) {
            navigate('/dashboard');
            alert('You must join the community to access this page.');
        }
    }, [user, navigate]);

    const fetchPosts = async () => {
        try {
            const res = await api.get('/community/posts');
            setPosts(res.data.data);
            
            // Auto-expand the most recent date
            if (res.data.data.length > 0) {
                const latestDate = new Date(res.data.data[0].createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                setExpandedDates({ [latestDate]: true });
            }
            
            setLoading(false);
        } catch (err) {
            setError('Failed to load community posts');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const toggleDateSection = (dateStr) => {
        setExpandedDates(prev => ({
            ...prev,
            [dateStr]: !prev[dateStr]
        }));
    };

    const groupPostsByDate = (posts) => {
        return posts.reduce((groups, post) => {
            const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!groups[dateStr]) {
                groups[dateStr] = [];
            }
            groups[dateStr].push(post);
            return groups;
        }, {});
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/community/posts', newPost);
            
            // Refetch to ensure correct grouping and latest data
            await fetchPosts();
            
            setNewPost({ title: '', content: '' });
            setShowPostForm(false);
        } catch (err) {
            alert('Failed to create post');
        }
    };

    const handleLikePost = async (postId) => {
        try {
            const res = await api.put(`/community/posts/${postId}/like`);
            setPosts(posts.map(post => 
                post._id === postId ? { ...post, likes: res.data.data } : post
            ));
        } catch (err) {
            console.error('Failed to like post', err);
        }
    };

    const toggleComments = async (postId) => {
        if (activeComments[postId]) {
            const newActive = { ...activeComments };
            delete newActive[postId];
            setActiveComments(newActive);
            return;
        }

        try {
            const res = await api.get(`/community/posts/${postId}/comments`);
            setActiveComments({ ...activeComments, [postId]: res.data.data });
        } catch (err) {
            console.error('Failed to load comments');
        }
    };

    const handleAddComment = async (e, postId) => {
        e.preventDefault();
        const content = newComments[postId];
        if (!content) return;

        try {
            const res = await api.post(`/community/posts/${postId}/comments`, { content });
            setActiveComments({
                ...activeComments,
                [postId]: [...(activeComments[postId] || []), res.data.data]
            });
            setNewComments({ ...newComments, [postId]: '' });
        } catch (err) {
            alert('Failed to add comment');
        }
    };

    const handleLikeComment = async (commentId, postId) => {
        try {
            const res = await api.put(`/community/comments/${commentId}/like`);
            setActiveComments({
                ...activeComments,
                [postId]: activeComments[postId].map(c => 
                    c._id === commentId ? { ...c, likes: res.data.data } : c
                )
            });
        } catch (err) {
            console.error('Failed to like comment');
        }
    };

    const groupedPosts = groupPostsByDate(posts);

    if (loading) return <div className="loading-container">{t("Loading Community...")}</div>;

    return (
        <div className="community-container">
            <div className="community-header">
                <div className="live-indicator">
                    <span className="pulse"></span> LIVE COMMUNITY
                </div>
                <h1>🤝 {t("JeevanGyaan Community")}</h1>
                <p>{t("Share knowledge, ask questions, and connect with other learners.")}</p>
                <button 
                    className="create-post-toggle"
                    onClick={() => setShowPostForm(!showPostForm)}
                >
                    {showPostForm ? t("Cancel") : t("Share Something New")}
                </button>
            </div>

            {showPostForm && (
                <div className="post-form-card">
                    <div className="post-form-header">
                        <div className="author-avatar post-create-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
                        <h3>{t("Share an Update, Idea, or Question")}</h3>
                    </div>
                    <form onSubmit={handleCreatePost}>
                        <div className="form-group">
                            <input 
                                className="post-input-title"
                                type="text" 
                                placeholder={t("Title of your post...")}
                                value={newPost.title}
                                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <textarea 
                                className="post-input-content"
                                placeholder={t("What's on your mind? Share all the details here...")}
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-footer">
                            <button type="submit" className="submit-post-btn">
                                <span>🚀 {t("Publish Post")}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="date-grouped-list">
                {Object.keys(groupedPosts).length === 0 ? (
                    <div className="empty-community">{t("No posts yet. Be the first to share!")}</div>
                ) : (
                    Object.keys(groupedPosts).map(dateStr => (
                        <div key={dateStr} className={`date-section ${expandedDates[dateStr] ? 'expanded' : ''}`}>
                            <div 
                                className="date-header" 
                                onClick={() => toggleDateSection(dateStr)}
                            >
                                <h2>📅 {dateStr}</h2>
                                <span className={`drop-icon ${expandedDates[dateStr] ? 'up' : 'down'}`}>▼</span>
                            </div>

                            {expandedDates[dateStr] && (
                                <div className="posts-container">
                                    {groupedPosts[dateStr].map(post => (
                                        <div key={post._id} className={`post-card ${post.author?._id === user?._id ? 'own-post' : ''}`}>
                                            <div className="post-content-area">
                                                <div className="post-meta">
                                                    <div className="author-avatar">{post.author?.username?.charAt(0).toUpperCase()}</div>
                                                    <div className="author-info">
                                                        <span className="author-name">
                                                            {post.author?.username}
                                                            {post.author?._id === user?._id && <span className="own-badge">YOU</span>}
                                                        </span>
                                                        <span className="post-time">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                <h2 className="post-title">{post.title}</h2>
                                                <p className="post-content">{post.content}</p>
                                            </div>
                                            
                                            <div className="post-footer">
                                                <div className="post-actions">
                                                    <button 
                                                        className={`action-btn like-btn ${post.likes.includes(user?._id) ? 'active' : ''}`}
                                                        onClick={() => handleLikePost(post._id)}
                                                    >
                                                        ❤️ {post.likes.length}
                                                    </button>
                                                    <button 
                                                        className={`action-btn comment-btn ${activeComments[post._id] ? 'active' : ''}`}
                                                        onClick={() => toggleComments(post._id)}
                                                    >
                                                        💬 {t("Discussion")} {activeComments[post._id] ? '▲' : '▼'}
                                                    </button>
                                                </div>
                                            </div>

                                            {activeComments[post._id] && (
                                                <div className="comments-dropdown">
                                                    <div className="comments-list">
                                                        {activeComments[post._id].length === 0 ? (
                                                            <div className="no-comments">{t("No replies yet. Start the conversation!")}</div>
                                                        ) : (
                                                            activeComments[post._id].map(comment => (
                                                                <div key={comment._id} className="comment-item">
                                                                    <div className="comment-header">
                                                                        <span className="comment-author">{comment.author?.username}</span>
                                                                        <span className="comment-date">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                                    </div>
                                                                    <p className="comment-content">{comment.content}</p>
                                                                    <button 
                                                                        className={`comment-like-btn ${comment.likes.includes(user?._id) ? 'active' : ''}`}
                                                                        onClick={() => handleLikeComment(comment._id, post._id)}
                                                                    >
                                                                        👍 {comment.likes.length}
                                                                    </button>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                    <form className="comment-form" onSubmit={(e) => handleAddComment(e, post._id)}>
                                                        <input 
                                                            type="text" 
                                                            placeholder={t("Write a reply...")}
                                                            value={newComments[post._id] || ''}
                                                            onChange={(e) => setNewComments({ ...newComments, [post._id]: e.target.value })}
                                                            required
                                                        />
                                                        <button type="submit" className="comment-submit-btn">🕊️</button>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Community;
