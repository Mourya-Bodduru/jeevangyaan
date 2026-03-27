import { Navigate } from 'react-router-dom';
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;    
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }
    return children;
};
export default ProtectedRoute;
