const jwt = require('jsonwebtoken');

function extractBearerToken(headerValue = '') {
    if (!headerValue.startsWith('Bearer ')) {
        return null;
    }

    return headerValue.slice('Bearer '.length).trim();
}

function requireAuth(req, res, next) {
    const token = extractBearerToken(req.headers.authorization || '');

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.auth = {
            userId: String(payload.id)
        };
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireSameUser(paramName = 'id') {
    return (req, res, next) => {
        if (!req.auth?.userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (String(req.params[paramName]) !== String(req.auth.userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        return next();
    };
}

module.exports = {
    requireAuth,
    requireSameUser
};
