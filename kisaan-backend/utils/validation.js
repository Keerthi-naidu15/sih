const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

function isValidEmail(email) {
    return EMAIL_REGEX.test(String(email || '').trim());
}

function isValidPhone(phone) {
    return PHONE_REGEX.test(String(phone || '').trim());
}

function isValidObjectId(value) {
    return OBJECT_ID_REGEX.test(String(value || '').trim());
}

function clampString(value, maxLength) {
    return String(value || '').trim().slice(0, maxLength);
}

module.exports = {
    isValidEmail,
    isValidPhone,
    isValidObjectId,
    clampString
};
