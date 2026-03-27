export const coinGuard = (minCoins) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized'
            });
        }

        if (req.user.coins < minCoins) {
            return res.status(403).json({
                success: false,
                error: `Access denied. You need at least ${minCoins} coins to access this feature.`,
                coinsRequired: minCoins,
                currentCoins: req.user.coins
            });
        }

        next();
    };
};

export const communityGuard = (req, res, next) => {
    if (!req.user.communityJoined) {
        return res.status(403).json({
            success: false,
            error: 'You must join the community to access this feature.',
            requiresJoin: true
        });
    }
    next();
};
