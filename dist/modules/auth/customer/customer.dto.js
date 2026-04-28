"use strict";
/**
 * Data Transfer Objects (DTOs) for Customer authentication
 * Defines the expected shape of data for customer authentication operations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.zCustomerIdParam = exports.zCustomerUpdateProfileDto = exports.zCustomerVerifyOtpDto = exports.zCustomerOtpLoginDto = exports.zCustomerLoginDto = exports.zCustomerRegisterDto = void 0;
const zod_1 = require("zod");
const bangladeshPhoneValidator = zod_1.z.string().regex(/^\+8801[3-9]\d{8}$/, {
    message: "Must be a valid Bangladesh phone number (+8801XXXXXXXXX)",
});
// Customer Registration DTO
exports.zCustomerRegisterDto = zod_1.z.object({
    phone: bangladeshPhoneValidator,
    name: zod_1.z.string().min(3, "Name must be at least 3 characters").optional(),
    address: zod_1.z.string().array().optional(),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional(),
});
// For /login endpoint (email/phone + password)
exports.zCustomerLoginDto = zod_1.z
    .object({
    email: zod_1.z.string().email().optional(),
    phone: bangladeshPhoneValidator.optional(),
    password: zod_1.z.string().min(6, "Password is required"),
})
    .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided",
});
// For /otp-login endpoint (phone only)
exports.zCustomerOtpLoginDto = zod_1.z.object({
    phone: bangladeshPhoneValidator,
});
// For /verify-otp endpoint
exports.zCustomerVerifyOtpDto = zod_1.z.object({
    phone: bangladeshPhoneValidator,
    otp: zod_1.z.string().length(6, "OTP must be 6 digits"),
});
// For PUT /:id endpoint
exports.zCustomerUpdateProfileDto = zod_1.z.object({
    name: zod_1.z.string().min(3, "Name is required").optional(),
    email: zod_1.z.string().email("Invalid email").optional(),
    address: zod_1.z.string().array().optional(),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional(),
});
// For GET /:id
// ID Param Validation (direct value)
exports.zCustomerIdParam = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "ID must be a positive integer",
});
