"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTUtils {
    constructor(secret) {
        this.secret = secret;
    }
    /**
     * Generate access token
     */
    generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.secret, {
            expiresIn: '15m'
        });
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.secret, {
            expiresIn: '7d'
        });
    }
    /**
     * Verify token
     */
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, this.secret);
    }
    /**
     * Decode token without verification
     */
    decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch {
            return null;
        }
    }
    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            return decoded.exp < Date.now() / 1000;
        }
        catch {
            return true;
        }
    }
    /**
     * Get token expiration time
     */
    getTokenExpiration(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            return new Date(decoded.exp * 1000);
        }
        catch {
            return null;
        }
    }
}
exports.JWTUtils = JWTUtils;
//# sourceMappingURL=jwt-utils.js.map