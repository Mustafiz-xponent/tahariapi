"use strict";
// /**
//  * Controller layer for Customer authentication operations.
//  * Handles HTTP requests and responses for customer authentication endpoints.
//  */
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import sendResponse from "@/utils/sendResponse";
// import { User } from "@/generated/prisma/client";
// import { handleErrorResponse } from "@/utils/errorResponseHandler";
// import * as customerService from "@/modules/auth/customer/customer.service";
// import {
//   zCustomerIdParam,
//   zCustomerLoginDto,
//   zCustomerOtpLoginDto,
//   zCustomerRegisterDto,
//   zCustomerUpdateProfileDto,
//   zCustomerVerifyOtpDto,
// } from "@/modules/auth/customer/customer.dto";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerById = exports.updateCustomerProfile = exports.verifyCustomerOtp = exports.otpLoginCustomer = exports.loginCustomer = exports.registerCustomer = void 0;
// /**
//  * Register a customer
//  */
// export const registerCustomer = async (req: Request, res: Response) => {
//   try {
//     const data = zCustomerRegisterDto.parse(req.body);
//     await customerService.registerCustomer(data);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.CREATED,
//       message: "Registration successful. OTP sent to your phone.",
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "register customer");
//   }
// };
// /**
//  * Login customer with email/phone and password
//  */
// export const loginCustomer = async (req: Request, res: Response) => {
//   try {
//     const data = zCustomerLoginDto.parse(req.body);
//     const { token, user } = await customerService.loginCustomer(data);
//     sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Login successful",
//       data: { token, user },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "login customer");
//   }
// };
// /**
//  * OTP login customer
//  */
// export const otpLoginCustomer = async (req: Request, res: Response) => {
//   try {
//     const data = zCustomerOtpLoginDto.parse(req.body);
//     const otp = await customerService.otpLoginCustomer(data);
//     sendResponse<{ otp: string }>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "OTP sent successfully",
//       data: { otp },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "OTP login");
//   }
// };
// /**
//  * Verify customer OTP
//  */
// export const verifyCustomerOtp = async (req: Request, res: Response) => {
//   try {
//     const data = zCustomerVerifyOtpDto.parse(req.body);
//     const { token, user } = await customerService.verifyCustomerOtp(data);
//     sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "OTP verified successfully",
//       data: { token, user },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "verify OTP");
//   }
// };
// /**
//  * Update customer profile by ID
//  */
// export const updateCustomerProfile = async (req: Request, res: Response) => {
//   try {
//     const requestingUserId = req.user?.userId;
//     if (!requestingUserId) {
//       throw new Error("Unauthorized");
//     }
//     const customerId = BigInt(req.params.id);
//     if (customerId !== BigInt(requestingUserId)) {
//       throw new Error("Invalid request!");
//     }
//     const data = zCustomerUpdateProfileDto.parse(req.body);
//     const updatedUser = await customerService.updateCustomerProfile(
//       customerId,
//       data
//     );
//     // Exclude sensitive fields from the response
//     const { passwordHash, ...sanitizedUser } = updatedUser;
//     sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Profile updated successfully",
//       data: { user: sanitizedUser },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "update profile");
//   }
// };
// /**
//  * Get customer by ID
//  */
// export const getCustomerById = async (req: Request, res: Response) => {
//   try {
//     const customerId = zCustomerIdParam.parse(req.params.id);
//     const requestingUserId = req.user?.userId;
//     if (!requestingUserId) {
//       throw new Error("Authentication required");
//     }
//     if (BigInt(requestingUserId) !== customerId) {
//       throw new Error("Can only access your own profile");
//     }
//     const customer = await customerService.getCustomerById(customerId);
//     sendResponse<Omit<User, "passwordHash">>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Customer retrieved successfully",
//       data: customer,
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "get customer by ID");
//   }
// };
// ------------------------------------ 2222222222222222222222222222222 ----------------------------------
// src/modules/auth/customer/customer.controller.ts
/**
 * Controller layer for Customer authentication operations.
 * Handles HTTP requests and responses for customer authentication endpoints.
 */
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const errorResponseHandler_1 = require("@/utils/errorResponseHandler");
const customerService = __importStar(require("@/modules/auth/customer/customer.service"));
const customer_dto_1 = require("@/modules/auth/customer/customer.dto");
// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
/**
 * Register a new customer with phone number.
 * Sends a verification OTP to the provided phone number upon success.
 *
 * @route POST /auth/customer/register
 */
const registerCustomer = async (req, res) => {
    try {
        const data = customer_dto_1.zCustomerRegisterDto.parse(req.body);
        const { expiresAt, otp } = await customerService.registerCustomer(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Registration successful. OTP sent to your phone.",
            data: { expiresAt, otp },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "register customer");
    }
};
exports.registerCustomer = registerCustomer;
// ---------------------------------------------------------------------------
// Password Login
// ---------------------------------------------------------------------------
/**
 * Login customer with email/phone and password.
 * Returns a JWT token and sanitized user object on success.
 *
 * @route POST /auth/customer/login
 */
const loginCustomer = async (req, res) => {
    try {
        const data = customer_dto_1.zCustomerLoginDto.parse(req.body);
        const { token, user } = await customerService.loginCustomer(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Login successful.",
            data: { token, user },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "login customer");
    }
};
exports.loginCustomer = loginCustomer;
// ---------------------------------------------------------------------------
// OTP Login
// ---------------------------------------------------------------------------
/**
 * Initiate OTP-based login for a customer.
 * Upserts the user record and sends an OTP to the provided phone number.
 * Returns OTP expiry time (and raw OTP outside production for testing).
 *
 * @route POST /auth/customer/otp-login
 */
const otpLoginCustomer = async (req, res) => {
    try {
        const data = customer_dto_1.zCustomerOtpLoginDto.parse(req.body);
        const { expiresAt, otp } = await customerService.otpLoginCustomer(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "OTP sent successfully. Please check your phone.",
            data: { expiresAt, otp },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "OTP login");
    }
};
exports.otpLoginCustomer = otpLoginCustomer;
// ---------------------------------------------------------------------------
// OTP Verification
// ---------------------------------------------------------------------------
/**
 * Verify customer OTP and complete authentication.
 * Activates the user account and returns a JWT token on success.
 *
 * @route POST /auth/customer/verify-otp
 */
const verifyCustomerOtp = async (req, res) => {
    try {
        const data = customer_dto_1.zCustomerVerifyOtpDto.parse(req.body);
        const { token, user } = await customerService.verifyCustomerOtp(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "OTP verified successfully.",
            data: { token, user },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "verify OTP");
    }
};
exports.verifyCustomerOtp = verifyCustomerOtp;
// ---------------------------------------------------------------------------
// Profile Management
// ---------------------------------------------------------------------------
/**
 * Update customer profile by ID.
 * Only the authenticated customer can update their own profile.
 * Sensitive fields (passwordHash) are excluded from the response.
 *
 * @route PUT /auth/customer/:id
 */
const updateCustomerProfile = async (req, res) => {
    try {
        const requestingUserId = req.user?.userId;
        if (!requestingUserId) {
            throw new Error("Authentication required.");
        }
        const customerId = customer_dto_1.zCustomerIdParam.parse(req.params.id);
        // Ensure the authenticated user can only update their own profile
        if (customerId !== BigInt(requestingUserId)) {
            throw new Error("You can only update your own profile.");
        }
        const data = customer_dto_1.zCustomerUpdateProfileDto.parse(req.body);
        const updatedUser = await customerService.updateCustomerProfile(customerId, data);
        // Exclude sensitive fields from the response
        const { passwordHash, ...sanitizedUser } = updatedUser;
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Profile updated successfully.",
            data: { user: sanitizedUser },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "update customer profile");
    }
};
exports.updateCustomerProfile = updateCustomerProfile;
/**
 * Get customer profile by ID.
 * Only the authenticated customer can retrieve their own profile.
 *
 * @route GET /auth/customer/:id
 */
const getCustomerById = async (req, res) => {
    try {
        const requestingUserId = req.user?.userId;
        if (!requestingUserId) {
            throw new Error("Authentication required.");
        }
        const customerId = customer_dto_1.zCustomerIdParam.parse(req.params.id);
        // Ensure the authenticated user can only access their own profile
        if (BigInt(requestingUserId) !== customerId) {
            throw new Error("You can only access your own profile.");
        }
        const customer = await customerService.getCustomerById(customerId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Customer retrieved successfully.",
            data: customer,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "get customer by ID");
    }
};
exports.getCustomerById = getCustomerById;
