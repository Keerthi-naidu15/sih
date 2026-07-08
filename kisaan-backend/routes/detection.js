const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/disease_scans');
const modelDir = path.join(__dirname, '../ai_models/disease');
const modelPath = path.join(modelDir, 'final_model.pth');
const classPath = path.join(modelDir, 'class_indices.json');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `scan-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/status', (req, res) => {
    const modelReady = fs.existsSync(modelPath);
    const classesReady = fs.existsSync(classPath);

    if (modelReady && classesReady) {
        return res.json({
            status: 'ready',
            message: 'Plant disease model is ready',
            modelFile: 'final_model.pth'
        });
    }

    return res.json({
        status: 'missing_assets',
        message: 'Plant disease model assets are missing',
        modelReady,
        classesReady,
        expectedFiles: ['final_model.pth', 'class_indices.json']
    });
});

router.post('/detect', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const scriptPath = path.join(modelDir, 'predict.py');
    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/disease_scans/${req.file.filename}`;

    const pythonProcess = spawn(pythonExecutable, [scriptPath, imagePath]);
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({
                error: 'Prediction failed',
                details: errorOutput || output || 'Unknown prediction error'
            });
        }

        try {
            const result = JSON.parse(output);

            if (result.error) {
                return res.status(500).json({ error: result.error });
            }

            return res.json({
                plant: result.plant,
                diseasePredicted: result.disease,
                rawClass: result.raw_class,
                confidence: `${result.confidence}%`,
                treatment: result.treatment,
                imageUrl
            });
        } catch (err) {
            return res.status(500).json({
                error: 'Invalid prediction output',
                rawOutput: output,
                details: err.message
            });
        }
    });
});

module.exports = router;
