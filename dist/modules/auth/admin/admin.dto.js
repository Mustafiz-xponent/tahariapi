"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zAdminResetPasswordDto = exports.zAdminForgotPasswordDto = exports.zAdminOtpRequestDto = exports.zAdminLoginDto = exports.zCreateAdminDto = void 0;
/**
 * Data Transfer Objects (DTOs) for Admin authentication
 * Defines the expected shape of data for admin authentication operations.
 */
const zod_1 = require("zod");
const bangladeshPhoneValidator = zod_1.z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/, "Must be a valid Bangladeshi phone number (+8801XXXXXXXXX)");
/**
 * Zod schema for creating an admin by super admin.
 */
exports.zCreateAdminDto = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: bangladeshPhoneValidator,
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number"),
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    address: zod_1.z.string().array().optional(),
});
/**
 * Zod schema for admin email/password login.
 */
exports.zAdminLoginDto = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    phone: bangladeshPhoneValidator.optional(),
    password: zod_1.z.string().optional(),
})
    .refine((data) => (data.email || data.phone) && data.password, {
    message: "Must provide email/phone with password",
});
exports.zAdminOtpRequestDto = zod_1.z.object({
    phone: bangladeshPhoneValidator,
});
/**
 * Forgot password schema
 */
exports.zAdminForgotPasswordDto = {
    body: zod_1.z.object({ phone: bangladeshPhoneValidator }),
};
/**
 * Reset password schema
 */
exports.zAdminResetPasswordDto = {
    body: zod_1.z.object({
        otp: zod_1.z.string().length(6, "OTP must be 6 digits"),
        phone: bangladeshPhoneValidator,
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[a-z]/, "Must contain at least one lowercase letter")
            .regex(/[0-9]/, "Must contain at least one number"),
    }),
};
