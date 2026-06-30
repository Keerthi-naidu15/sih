const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        unique: true,
        sparse: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    name: {
        type: String,
        trim: true
    },
    language: {
        type: String,
        default: 'English'
    },
    location: String,
    crop_type: String,
    soil_type: String,
    points: {
        type: Number,
        default: 0
    },
    points_today: {
        type: Number,
        default: 0
    },
    last_point_date: Date,
    role: {
        type: String,
        default: 'farmer'
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
