const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { rateLimit } = require('../middleware/rateLimit');
const { isValidEmail, isValidPhone, clampString } = require('../utils/validation');

const router = express.Router();

router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 15,
    keyPrefix: 'auth',
    message: 'Too many authentication attempts. Please wait and try again.'
}));

function normalizeEmail(email) {
    return email ? String(email).trim().toLowerCase() : undefined;
}

function normalizePhone(phone) {
    return phone ? String(phone).trim() : undefined;
}

function sanitizeUser(userDoc) {
    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete user.password;
    return user;
}

function signToken(user) {
    return jwt.sign(
        { id: String(user._id) },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

router.post('/signup', async (req, res) => {
    try {
        const name = clampString(req.body.name, 80);
        const email = normalizeEmail(req.body.email);
        const phone = normalizePhone(req.body.phone);
        const password = String(req.body.password || '');

        if (!name || !email || !phone || !password) {
            return res.status(400).json({ error: 'Name, email, phone, and password are required' });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        if (!isValidPhone(phone)) {
            return res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (password.length > 128) {
            return res.status(400).json({ error: 'Password is too long' });
        }

        const existing = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
            points: 10
        });

        return res.json({
            token: signToken(user),
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('[Auth][Signup]', error);
        return res.status(500).json({ error: 'Signup failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const identifier = String(req.body.identifier || '').trim();
        const password = String(req.body.password || '');

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password are required' });
        }

        if (password.length > 128) {
            return res.status(400).json({ error: 'Password is too long' });
        }

        const user = await User.findOne({
            $or: [
                { email: normalizeEmail(identifier) },
                { phone: normalizePhone(identifier) }
            ]
        }).select('+password');

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const matches = await bcrypt.compare(password, user.password);

        if (!matches) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        return res.json({
            token: signToken(user),
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('[Auth][Login]', error);
        return res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
