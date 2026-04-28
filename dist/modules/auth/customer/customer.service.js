"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCustomer = registerCustomer;
exports.loginCustomer = loginCustomer;
exports.otpLoginCustomer = otpLoginCustomer;
exports.verifyCustomerOtp = verifyCustomerOtp;
exports.updateCustomerProfile = updateCustomerProfile;
exports.getCustomerById = getCustomerById;
/**
 * Service layer for Customer authentication operations.
 * Handles registration, login, OTP generation, verification, and JWT issuance for customers.
 */
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const prismaClient_1 = __importDefault(require("../../../prisma-client/prismaClient"));
const authToken_1 = require("../../../utils/authToken");
const errorHandler_1 = require("../../../utils/errorHandler");
const otpService_1 = require("../../../utils/otpService");
/**
 * Register new customer with phone number
 */
async function registerCustomer(data) {
    try {
        // Validate phone number uniqueness
        const existingUser = await prismaClient_1.default.user.findUnique({
            where: { phone: data.phone },
        });
        if (existingUser) {
            throw new Error("Phone number already registered");
        }
        // Hash the password before storing
        const saltRounds = 10;
        const passwordHash = data.password
            ? await bcrypt_1.default.hash(data.password, saltRounds)
            : null;
        // Create user record with hashed password
        const user = await prismaClient_1.default.user.create({
            data: {
                phone: data.phone,
                name: data.name,
                address: data.address || [],
                passwordHash: passwordHash,
                role: "CUSTOMER",
                status: "PENDING",
                customer: { create: {} },
            },
        });
        // Send verification OTP
        await (0, otpService_1.sendOtp)(data.phone);
        // Return user data without sensitive fields
        const { passwordHash: _, ...userData } = user;
        return { user: userData };
    }
    catch (error) {
        throw new Error(`Failed to register customer: ${(0, errorHandler_1.getErrorMessage)(error)}`);
    }
}
/**
 * Login customer with email/phone and password
 */
async function loginCustomer(data) {
    // Determine identifier (email or phone)
    const identifier = data.email
        ? { email: data.email }
        : { phone: data.phone };
    const user = await prismaClient_1.default.user.findUnique({
        where: identifier,
    });
    if (!user || user.role !== "CUSTOMER") {
        throw new Error("Customer not found");
    }
    if (!user.passwordHash) {
        throw new Error("Password login not enabled for this account");
    }
    const isValid = await bcrypt_1.default.compare(data.password, user.passwordHash);
    if (!isValid) {
        throw new Error("Invalid password");
    }
    return (0, authToken_1.generateAuthToken)(user);
}
/**
 * OTP login customer
 */
async function otpLoginCustomer(data) {
    await prismaClient_1.default.user.upsert({
        where: { phone: data.phone },
        update: {}, // No updates needed if user exists
        create: {
            phone: data.phone,
            role: "CUSTOMER",
            status: "PENDING",
            customer: { create: {} },
        },
    });
    const res = await (0, otpService_1.sendOtp)(data.phone);
    return res.otp; // TODO: Need to remove this line when in production
}
/**
 * Verify OTP
 */
async function verifyCustomerOtp(data) {
    const otpRecord = await prismaClient_1.default.otp.findFirst({
        where: { phone: data.phone, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
    });
    logger_1.default.info("OTP record:", otpRecord);
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
        throw new Error("Invalid or expired OTP");
    }
    const isValidOtp = await (0, otpService_1.verifyOtp)(data.phone, data.otp);
    if (!isValidOtp) {
        throw new Error("Invalid OTP");
    }
    const user = await prismaClient_1.default.user.findUnique({
        where: { phone: data.phone },
        include: {
            customer: {
                include: {
                    wallet: true,
                },
            },
        },
    });
    if (!user || user.role !== "CUSTOMER") {
        throw new Error("Customer not found");
    }
    // create customer wallet if not exist--
    if (user.customer && !user.customer.wallet) {
        await prismaClient_1.default.wallet.create({
            data: {
                customerId: user.customer.customerId,
            },
        });
    }
    const updatedUser = await prismaClient_1.default.user.update({
        where: { phone: data.phone },
        data: { status: "ACTIVE" },
        include: {
            customer: {
                select: {
                    customerId: true,
                    wallet: { select: { walletId: true } },
                },
            },
        },
    });
    // Delete all OTP records for the user after successful verification
    await prismaClient_1.default.otp.deleteMany({
        where: { phone: data.phone },
    });
    return (0, authToken_1.generateAuthToken)(updatedUser);
}
/**
 * Update customer profile
 */
async function updateCustomerProfile(userId, data) {
    const updateData = {
        updatedAt: new Date(), // Always update the updatedAt field
    };
    if (data.name)
        updateData.name = data.name;
    if (data.email)
        updateData.email = data.email;
    if (data.address)
        updateData.address = data.address;
    // Handle password update with hashing
    if (data.password) {
        const saltRounds = 10;
        updateData.passwordHash = await bcrypt_1.default.hash(data.password, saltRounds);
    }
    // Check if any fields were actually provided (beyond updatedAt)
    const hasUpdates = Object.keys(updateData).some((key) => key !== "updatedAt" &&
        updateData[key] !== undefined);
    if (!hasUpdates) {
        throw new Error("No valid fields provided for update");
    }
    return await prismaClient_1.default.user.update({
        where: { userId },
        data: updateData,
    });
}
/**
 * Get customer by ID
 * @throws Error if customer not found or unauthorized
 */
async function getCustomerById(userId) {
    const user = await prismaClient_1.default.user.findUnique({
        where: { userId },
        include: { customer: true },
    });
    if (!user) {
        throw new Error("Customer not found");
    }
    if (user.role !== "CUSTOMER") {
        throw new Error("User is not a customer");
    }
    const { passwordHash, ...customerData } = user;
    return customerData;
}
