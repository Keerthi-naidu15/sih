const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const Advisory = require('../models/Advisory');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { clampString, isValidObjectId } = require('../utils/validation');

const router = express.Router();

router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'advisory',
    message: 'Too many advisory requests. Please try again later.'
}));

function pickCrop(body = {}) {
    return (
        body.crop ||
        body.crop_type ||
        body.cropType ||
        body['Crop Type'] ||
        body.CropType ||
        ''
    )
        .toString()
        .trim()
        .toLowerCase();
}

function fallbackAdvisory(body = {}) {
    const crop = pickCrop(body);
    const csvPath = path.join(__dirname, '../ai_models/advisory/data/fertilizer.csv');

    if (!fs.existsSync(csvPath)) {
        return {
            fertilizer: 'General NPK recommendation unavailable (fallback data missing).',
            confidence: 0
        };
    }

    const rows = fs
        .readFileSync(csvPath, 'utf8')
        .split(/\r?\n/)
        .slice(1)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split(','));

    const match = rows.find((cols) => (cols[1] || '').toLowerCase() === crop);

    if (!match) {
        return {
            fertilizer: 'Apply a balanced NPK fertilizer as per local soil test. (Fallback mode)',
            confidence: 35
        };
    }

    return {
        fertilizer: `Recommended ratio for ${match[1]}: N:${match[2]}, P:${match[3]}, K:${match[4]} (fallback mode)`,
        confidence: 55
    };
}

router.post('/recommend', requireAuth, async (req, res) => {
    if (!isValidObjectId(req.auth.userId)) {
        return res.status(400).json({ error: 'Invalid authenticated user id' });
    }

    const normalizedBody = {
        ...req.body,
        SoilType: clampString(req.body?.SoilType, 40),
        CropType: clampString(req.body?.CropType, 80)
    };

    const numericFields = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Phosphorous', 'Potassium'];
    for (const field of numericFields) {
        const value = Number(normalizedBody[field]);
        if (!Number.isFinite(value)) {
            return res.status(400).json({ error: `Invalid ${field} value` });
        }
        normalizedBody[field] = value;
    }

    const requestBody = {
        ...normalizedBody,
        user_id: req.auth.userId
    };

    const scriptPath = path.join(__dirname, '../ai_models/advisory/predict.py');
    const modelDir = path.join(__dirname, '../ai_models/advisory/models');
    const classifierPath = path.join(modelDir, 'classifier.pkl');
    const encoderPath = path.join(modelDir, 'fertilizer_encoder.pkl');

    if (!fs.existsSync(classifierPath) || !fs.existsSync(encoderPath)) {
        const result = fallbackAdvisory(requestBody);
        await Advisory.findOneAndUpdate(
            { user_id: req.auth.userId },
            {
                user_id: req.auth.userId,
                fertilizer: result.fertilizer,
                confidence: result.confidence,
                input: requestBody
            },
            { upsert: true, new: true }
        );

        return res.json({
            ...result,
            note: 'ML model files missing (classifier.pkl, fertilizer_encoder.pkl). Returned CSV-based fallback advisory.'
        });
    }

    const pythonProcess = spawn('python', [scriptPath, JSON.stringify(requestBody)]);
    let output = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { error += data.toString(); });

    pythonProcess.on('error', (spawnError) => {
        console.error('[Advisory] Spawn error:', spawnError.message);
        return res.status(500).json({
            error: `Failed to start Python: ${spawnError.message}. Make sure Python is installed and on PATH.`
        });
    });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error('[Advisory] Python error:', error);
            return res.status(500).json({ error });
        }

        try {
            const result = JSON.parse(output);

            await Advisory.findOneAndUpdate(
                { user_id: req.auth.userId },
                {
                    user_id: req.auth.userId,
                    fertilizer: result.fertilizer,
                    confidence: result.confidence,
                    input: requestBody
                },
                { upsert: true, new: true }
            );

            return res.json(result);
        } catch (parseError) {
            return res.status(500).json({ error: 'Invalid response', raw: output });
        }
    });
});

router.get('/latest/:userId', requireAuth, async (req, res) => {
    if (!isValidObjectId(req.params.userId)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }

    if (String(req.params.userId) !== String(req.auth.userId)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    try {
        const advisory = await Advisory.findOne({ user_id: req.auth.userId })
            .sort({ createdAt: -1 });

        if (!advisory) {
            return res.status(404).json({ error: 'No advisory found' });
        }

        return res.json({
            fertilizer: advisory.fertilizer,
            confidence: advisory.confidence
        });
    } catch (error) {
        console.error('[Advisory][Latest]', error);
        return res.status(500).json({ error: 'Failed to fetch advisory' });
    }
});

module.exports = router;
