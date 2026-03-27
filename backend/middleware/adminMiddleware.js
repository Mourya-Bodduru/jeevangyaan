const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            error: 'Not authorized as an admin',
            statusCode: 403
        });
    }
};

export { admin };
