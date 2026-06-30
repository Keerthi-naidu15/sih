const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const User = require('../models/user');
const Chat = require('../models/Chat');
const Scan = require('../models/Scan');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { clampString, isValidObjectId } = require('../utils/validation');

const router = express.Router();

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image uploads are allowed'));
        }

        return cb(null, true);
    }
});

router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 60,
    keyPrefix: 'api-ai',
    message: 'Too many AI requests. Please slow down and try again later.'
}));

async function addDailyPoints(user) {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = user.last_point_date
        ? new Date(user.last_point_date).toISOString().split('T')[0]
        : null;

    let pointsToday = lastDate === todayStr ? (user.points_today || 0) : 0;
    let pointsEarned = 0;

    if (pointsToday < 20) {
        pointsEarned = Math.min(20, 20 - pointsToday);
        pointsToday += pointsEarned;

        await User.findByIdAndUpdate(user._id, {
            $inc: { points: pointsEarned },
            points_today: pointsToday,
            last_point_date: new Date()
        });
    }

    return pointsEarned;
}

async function requireExistingUser(userId) {
    return User.findById(userId);
}

router.post('/chat', requireAuth, async (req, res) => {
    const message = clampString(req.body.message, 2000);

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!isValidObjectId(req.auth.userId)) {
        return res.status(400).json({ error: 'Invalid authenticated user id' });
    }

    try {
        const user = await requireExistingUser(req.auth.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const langPref = user.language || 'English';

        await Chat.create({
            user_id: user._id,
            message,
            is_bot_reply: false
        });

        const history = await Chat.find({ user_id: user._id })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

        const messages = [
            {
                role: 'system',
                content: `You are Kisaan Mitra AI, a helpful agricultural expert for Indian farmers. Reply concisely and practically. Respond in this language: "${langPref}".`
            }
        ];

        for (const item of history.reverse()) {
            messages.push({
                role: item.is_bot_reply ? 'assistant' : 'user',
                content: item.message
            });
        }

        let botReply = "I'm sorry, I couldn't process your request.";

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(`${LLM_SERVICE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, language: langPref }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`LLM service error ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            if (data?.reply) {
                botReply = data.reply;
            }
        } catch (error) {
            console.error('[API][Chat][LLM]', error.message);
            return res.status(503).json({
                error: error.name === 'AbortError'
                    ? 'The AI is still loading. Please wait 30 seconds and try again.'
                    : 'AI service error. Make sure the FastAPI service is running on port 8000.'
            });
        }

        await Chat.create({
            user_id: user._id,
            message: botReply,
            is_bot_reply: true
        });

        const pointsEarned = await addDailyPoints(user);

        return res.json({
            reply: botReply,
            points_earned: pointsEarned
        });
    } catch (error) {
        console.error('[API][Chat]', error);
        return res.status(500).json({ error: 'Failed to generate AI response.' });
    }
});

router.post('/upload-image', requireAuth, upload.single('image'), async (req, res) => {
    if (!isValidObjectId(req.auth.userId)) {
        return res.status(400).json({ error: 'Invalid authenticated user id' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    try {
        const user = await requireExistingUser(req.auth.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const imagePath = req.file.path;
        const fileBytes = fs.readFileSync(imagePath);
        const base64Data = fileBytes.toString('base64');

        let parsedData = {
            diseasePredicted: 'Analysis Failed',
            confidence: '0%',
            treatment: 'Could not process image.'
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(`${LLM_SERVICE_URL}/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_base64: base64Data }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Vision service error ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            if (data) {
                parsedData = {
                    diseasePredicted: data.diseasePredicted || 'Analysis Completed',
                    confidence: data.confidence || 'N/A',
                    treatment: data.treatment || 'See full response above.'
                };
            }
        } catch (error) {
            console.error('[API][Upload][Vision]', error.message);
            return res.status(503).json({
                error: error.name === 'AbortError'
                    ? 'The AI is still loading. Please wait 30 seconds and try again.'
                    : 'Vision AI service error. Make sure the FastAPI service is running on port 8000.'
            });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const scanCountToday = await Scan.countDocuments({
            user_id: user._id,
            createdAt: { $gte: startOfDay }
        });

        await Scan.create({
            user_id: user._id,
            image_url: imagePath,
            disease_predicted: parsedData.diseasePredicted,
            confidence: parsedData.confidence,
            treatment: parsedData.treatment
        });

        let pointsEarned = 0;
        if (scanCountToday < 1) {
            pointsEarned = 10;
            await User.findByIdAndUpdate(user._id, { $inc: { points: 10 } });
        }

        return res.json({
            ...parsedData,
            imageUrl: imagePath,
            points_earned: pointsEarned
        });
    } catch (error) {
        console.error('[API][Upload]', error);
        return res.status(500).json({ error: 'Failed to process image scan.' });
    }
});

router.get('/points/:user_id', requireAuth, async (req, res) => {
    if (!isValidObjectId(req.params.user_id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    if (String(req.params.user_id) !== String(req.auth.userId)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const user = await User.findById(req.auth.userId).select('points');
        return res.json({ points: user ? user.points : 0 });
    } catch (error) {
        console.error('[API][Points]', error);
        return res.status(500).json({ error: 'Failed to fetch points' });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Image must be 5MB or smaller' });
        }

        return res.status(400).json({ error: err.message });
    }

    if (err?.message === 'Only image uploads are allowed') {
        return res.status(400).json({ error: err.message });
    }

    return next(err);
});

module.exports = router;
