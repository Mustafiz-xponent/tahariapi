"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtp = sendOtp;
exports.verifyOtp = verifyOtp;
const axios_1 = __importDefault(require("axios"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = __importDefault(require("../utils/logger"));
const prismaClient_1 = __importDefault(require("../prisma-client/prismaClient"));
const OTP_EXPIRY_MINUTES = 5;
const SALT_ROUNDS = 10;
/**
 * Send SMS
 */
async function sendSms(phone, message) {
    // Validate required environment variables
    if (!process.env.SMS_API_KEY || !process.env.SMS_API_URL) {
        throw new Error("SMS API configuration is missing");
    }
    // Prepare SMS payload
    const smsPayload = new URLSearchParams();
    smsPayload.append("api_key", process.env.SMS_API_KEY);
    smsPayload.append("to", phone);
    smsPayload.append("msg", message);
    // Add sender ID if configured
    if (process.env.SMS_SENDER_ID) {
        smsPayload.append("sender_id", process.env.SMS_SENDER_ID);
        3.;
    }
    // Send SMS
    const response = await axios_1.default.post(process.env.SMS_API_URL, smsPayload.toString(), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    // Check SMS API response
    if (response.data?.error !== 0) {
        console.error("SMS API Error:", response.data);
        throw new Error(`Failed to send SMS: ${response.data?.msg || "Unknown error"}`);
    }
    logger_1.default.info("SMS sent successfully:", response.data);
}
/**
 * Send OTP
 */
async function sendOtp(phone) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt_1.default.hash(otp, SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000); // 5 minutes
    await prismaClient_1.default.otp.create({
        data: { phone, otpHash, expiresAt },
    });
    logger_1.default.info(`OTP for ${phone}: ${otp}`);
    // Send SMS with OTP
    const message = `Your OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`;
    // return { otp }; // TODO: Need to remove this line when in production
    // TODO: Enable the sendSMS function at production
    await sendSms(phone, message);
}
/**
 * Verify OTP
 */
async function verifyOtp(phone, otp) {
    const otpRecord = await prismaClient_1.default.otp.findFirst({
        where: { phone, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
    });
    if (!otpRecord)
        return false;
    return bcrypt_1.default.compare(otp, otpRecord.otpHash);
}
