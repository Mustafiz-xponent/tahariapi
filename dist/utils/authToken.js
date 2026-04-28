"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuthToken = generateAuthToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate auth token
 */
function generateAuthToken(user) {
    const jwtSecret = process.env.JWT_SECRET;
    const options = { expiresIn: 7 * 24 * 60 * 60 }; // 7 days
    const token = jsonwebtoken_1.default.sign({
        userId: user.userId,
        phone: user.phone,
        email: user.email,
        role: user.role,
    }, jwtSecret, options);
    return { token, user };
}
