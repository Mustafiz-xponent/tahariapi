"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdmin = exports.adminResetPassword = exports.adminForgotPassword = void 0;
exports.createAdmin = createAdmin;
exports.loginAdmin = loginAdmin;
/**
 * Service layer for Admin authentication operations.
 * Handles admin creation by super admins and login.
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("@/utils/appError");
const prismaClient_1 = __importDefault(require("@/prisma-client/prismaClient"));
const authToken_1 = require("@/utils/authToken");
const errorHandler_1 = require("@/utils/errorHandler");
const otpService_1 = require("@/utils/otpService");
const client_1 = require("@/generated/prisma/client");
const SALT_ROUNDS = 10;
/**
 * Create admin by super admin only
 */
async function createAdmin(data) {
    try {
        // Check if email or phone already exists
        const existingUser = await prismaClient_1.default.user.findFirst({
            where: {
                OR: [{ email: data.email }, { phone: data.phone }],
            },
        });
        if (existingUser) {
            throw new Error(existingUser.email === data.email
                ? "Email already registered"
                : "Phone number already registered");
        }
        const passwordHash = await bcrypt_1.default.hash(data.password, SALT_ROUNDS);
        const user = await prismaClient_1.default.user.create({
            data: {
                email: data.email,
                phone: data.phone,
                name: data.name,
                address: data.address || [],
                passwordHash,
                role: "ADMIN",
                status: "ACTIVE",
                admin: { create: {} },
            },
        });
        const { passwordHash: _, ...userData } = user;
        return { user: userData };
    }
    catch (error) {
        throw new Error(`Failed to create admin: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * login admin/superAdmin through email/phone with password.
 */
async function loginAdmin(data) {
    try {
        // Validate input
        if (!data.password)
            throw new Error("Password is required");
        if (!data.email && !data.phone) {
            throw new Error("Email or phone is required");
        }
        // Determine identifier
        const identifier = data.email
            ? { email: data.email }
            : { phone: data.phone };
        // Find user
        const user = await prismaClient_1.default.user.findUnique({
            where: identifier,
            include: { admin: true },
        });
        // Validate user
        if (!user)
            throw new Error("Invalid credentials");
        if (!user.passwordHash)
            throw new Error("Password not set yet");
        if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
            throw new Error("Invalid credentials");
        }
        const { passwordHash: _, ...userData } = user;
        // Verify password
        const isValid = await bcrypt_1.default.compare(data.password, user.passwordHash);
        if (!isValid)
            throw new Error("Invalid credentials");
        // Generate token
        return (0, authToken_1.generateAuthToken)(userData);
    }
    catch (error) {
        throw new Error(`Failed to login admin: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 *
 */
const adminForgotPassword = async (phone) => {
    // check user exits or not
    const user = await prismaClient_1.default.user.findUnique({
        where: { phone: phone },
        select: { userId: true },
    });
    if (!user) {
        throw new appError_1.AppError("User not found", http_status_1.default.NOT_FOUND);
    }
    // send otp via sms
    const res = await (0, otpService_1.sendOtp)(phone);
    return res.otp; // TODO: Need to remove this line when in production
};
exports.adminForgotPassword = adminForgotPassword;
/**
 * Resets an admin's password using a valid OTP sent to their phone.
 * @throws {AppError} If the OTP is invalid or has expired
 * @throws {AppError} If the user is not found
 */
const adminResetPassword = async (bodyData) => {
    const { otp, phone, password } = bodyData;
    const now = new Date();
    // Check OTP exits or not
    const otpRecord = await prismaClient_1.default.otp.findFirst({
        where: { phone, expiresAt: { gt: now } },
        orderBy: { createdAt: "desc" },
    });
    if (!otpRecord) {
        throw new appError_1.AppError("Your OTP is not valid", http_status_1.default.UNAUTHORIZED);
    }
    // Check is OTP valid or not
    const isValidOtp = await (0, otpService_1.verifyOtp)(phone, otp);
    if (!isValidOtp) {
        throw new appError_1.AppError("Your OTP is not valid", http_status_1.default.UNAUTHORIZED);
    }
    // Check user exits or not
    const user = await prismaClient_1.default.user.findUnique({
        where: { phone: phone },
        select: { userId: true, role: true, passwordHash: true },
    });
    if (!user) {
        throw new appError_1.AppError("User not found", http_status_1.default.NOT_FOUND);
    }
    // Check user role is ADMIN | SUPER_ADMIN | SUPPORT
    const validRoles = [
        client_1.UserRole.ADMIN,
        client_1.UserRole.SUPER_ADMIN,
        client_1.UserRole.SUPPORT,
    ];
    if (!validRoles.includes(user.role)) {
        throw new appError_1.AppError("You are not permitted", http_status_1.default.UNAUTHORIZED);
    }
    // Check user current password is same as new password
    const isValidPassword = await bcrypt_1.default.compare(password, user.passwordHash);
    if (isValidPassword) {
        throw new appError_1.AppError("New password cannot be the same as the current password", http_status_1.default.BAD_REQUEST);
    }
    // Update password
    const SALT_ROUNDS = 10;
    await prismaClient_1.default.otp.deleteMany({
        where: { phone: phone },
    });
    const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
    await prismaClient_1.default.user.update({
        where: { phone: phone },
        data: { passwordHash },
    });
    // Delete all OTP records for the user
    await prismaClient_1.default.otp.deleteMany({
        where: { phone: phone },
    });
};
exports.adminResetPassword = adminResetPassword;
/**
 * Delete an admin by ID
 * @param adminId The ID of the admin to delete
 * @param requestingUserId The ID of the superAdmin making the request
 * @throws Error if admin not found or if trying to delete self
 */
const deleteAdmin = async (adminId, requestingUserId) => {
    try {
        // Prevent self-deletion
        if (requestingUserId && BigInt(requestingUserId) === adminId) {
            throw new Error("SuperAdmin cannot delete themselves");
        }
        return await prismaClient_1.default.$transaction(async (prisma) => {
            // Verify admin exists and is not a superAdmin
            const adminToDelete = await prisma.user.findUnique({
                where: { userId: Number(adminId) },
                include: { admin: true },
            });
            if (!adminToDelete) {
                throw new Error("Admin not found");
            }
            if (adminToDelete.role === "SUPER_ADMIN") {
                throw new Error("Cannot delete a superAdmin");
            }
            // Delete the admin record first if it exists
            if (adminToDelete.admin) {
                await prisma.admin.delete({
                    where: { userId: Number(adminId) },
                });
            }
            // Then delete the user
            return await prisma.user.delete({
                where: { userId: Number(adminId) },
            });
        });
    }
    catch (error) {
        throw new Error(`Error deleting admin: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
};
exports.deleteAdmin = deleteAdmin;
