"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashString = hashString;
exports.generateSecureRandomString = generateSecureRandomString;
exports.generateSecureToken = generateSecureToken;
exports.createHMAC = createHMAC;
exports.verifyHMAC = verifyHMAC;
exports.generateAPIKey = generateAPIKey;
exports.maskSensitiveData = maskSensitiveData;
exports.generateChecksum = generateChecksum;
exports.validateChecksum = validateChecksum;
exports.encodeBase64 = encodeBase64;
exports.decodeBase64 = decodeBase64;
exports.generatePasswordHash = generatePasswordHash;
exports.verifyPassword = verifyPassword;
exports.generateJWTSecret = generateJWTSecret;
exports.createSignature = createSignature;
exports.verifySignature = verifySignature;
const crypto_1 = require("crypto");
function hashString(input, algorithm = 'sha256') {
    return (0, crypto_1.createHash)(algorithm).update(input).digest('hex');
}
function generateSecureRandomString(length = 32) {
    return (0, crypto_1.randomBytes)(length).toString('hex');
}
function generateSecureToken() {
    return (0, crypto_1.randomBytes)(64).toString('hex');
}
function createHMAC(message, secret, algorithm = 'sha256') {
    return (0, crypto_1.createHmac)(algorithm, secret).update(message).digest('hex');
}
function verifyHMAC(message, signature, secret, algorithm = 'sha256') {
    const expectedSignature = createHMAC(message, secret, algorithm);
    return signature === expectedSignature;
}
function generateAPIKey(prefix = 'opsai') {
    const timestamp = Date.now().toString(36);
    const random = generateSecureRandomString(16);
    return `${prefix}_${timestamp}_${random}`;
}
function maskSensitiveData(data, type) {
    switch (type) {
        case 'email':
            const [local, domain] = data.split('@');
            return `${local?.charAt(0) || 'u'}***@${domain}`;
        case 'phone':
            return data.replace(/(\d{3})\d{3}(\d{4})/, '$1-***-$2');
        case 'ssn':
            return data.replace(/(\d{3})\d{2}(\d{4})/, '$1-**-$2');
        case 'credit_card':
            return data.replace(/(\d{4})\d{8}(\d{4})/, '$1-****-****-$2');
        default:
            return data;
    }
}
function generateChecksum(data) {
    return (0, crypto_1.createHash)('md5').update(data).digest('hex');
}
function validateChecksum(data, expectedChecksum) {
    const actualChecksum = generateChecksum(data);
    return actualChecksum === expectedChecksum;
}
function encodeBase64(data) {
    return Buffer.from(data, 'utf8').toString('base64');
}
function decodeBase64(data) {
    return Buffer.from(data, 'base64').toString('utf8');
}
function generatePasswordHash(password, salt) {
    const generatedSalt = salt || generateSecureRandomString(16);
    const hash = (0, crypto_1.createHmac)('sha256', generatedSalt).update(password).digest('hex');
    return { hash, salt: generatedSalt };
}
function verifyPassword(password, hash, salt) {
    const { hash: expectedHash } = generatePasswordHash(password, salt);
    return hash === expectedHash;
}
function generateJWTSecret() {
    return (0, crypto_1.randomBytes)(64).toString('base64');
}
function createSignature(data, secret) {
    const jsonString = JSON.stringify(data);
    return createHMAC(jsonString, secret);
}
function verifySignature(data, signature, secret) {
    const expectedSignature = createSignature(data, secret);
    return signature === expectedSignature;
}
//# sourceMappingURL=crypto.js.map