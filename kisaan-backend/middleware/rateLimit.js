const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;

const buckets = new Map();

function getClientKey(req, keyPrefix = 'global') {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    return `${keyPrefix}:${ip}`;
}

function rateLimit({ windowMs = DEFAULT_WINDOW_MS, maxRequests = DEFAULT_MAX_REQUESTS, keyPrefix = 'global', message } = {}) {
    return (req, res, next) => {
        const key = getClientKey(req, keyPrefix);
        const now = Date.now();
        const bucket = buckets.get(key);

        if (!bucket || bucket.expiresAt <= now) {
            buckets.set(key, {
                count: 1,
                expiresAt: now + windowMs
            });
            return next();
        }

        bucket.count += 1;

        if (bucket.count > maxRequests) {
            const retryAfterSeconds = Math.ceil((bucket.expiresAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfterSeconds));
            return res.status(429).json({
                error: message || 'Too many requests. Please try again later.'
            });
        }

        return next();
    };
}

module.exports = {
    rateLimit
};
