const express = require('express');

const User = require('../models/user');
const { requireAuth, requireSameUser } = require('../middleware/auth');
const { isValidObjectId, clampString } = require('../utils/validation');

const router = express.Router();

function sanitizeUser(userDoc) {
    const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete user.password;
    return user;
}

router.get('/:id', requireAuth, requireSameUser('id'), async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(sanitizeUser(user));
    } catch (error) {
        console.error('[Users][Get]', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.put('/:id', requireAuth, requireSameUser('id'), async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    try {
        const allowedFields = ['language', 'crop_type', 'location', 'soil_type', 'name'];
        const updates = Object.fromEntries(
            Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
        );

        if (updates.language) updates.language = clampString(updates.language, 40);
        if (updates.name) updates.name = clampString(updates.name, 80);
        if (updates.location) updates.location = clampString(updates.location, 120);
        if (updates.crop_type) updates.crop_type = clampString(updates.crop_type, 80);
        if (updates.soil_type) updates.soil_type = clampString(updates.soil_type, 80);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json(sanitizeUser(user));
    } catch (error) {
        console.error('[Users][Update]', error);
        return res.status(500).json({ error: 'Failed to update user' });
    }
});

module.exports = router;
