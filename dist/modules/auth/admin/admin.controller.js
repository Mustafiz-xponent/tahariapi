"use strict";
// /**
//  * Controller layer for Admin authentication operations.
//  * Handles HTTP requests and responses for admin authentication endpoints.
//  */
// import { z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import asyncHandler from "../../../utils/asyncHandler";
// import sendResponse from "../../../utils/sendResponse";
// import { User } from "../../../generated/prisma/client";
// import { handleErrorResponse } from "../../../utils/errorResponseHandler";
// import * as adminService from "../../../modules/auth/admin/admin.service";
// import {
//   AdminForgotPasswordDto,
//   AdminResetPasswordDto,
//   zAdminLoginDto,
//   zCreateAdminDto,
// } from "../../../modules/auth/admin/admin.dto";
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
exports.deleteAdmin = exports.adminResetPassword = exports.adminForgotPassword = exports.loginAdmin = exports.createAdmin = void 0;
// const adminIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
//   message: "Admin ID must be a positive integer",
// });
// /**
//  * Create admin by super admin only
//  */
// export const createAdmin = async (req: Request, res: Response) => {
//   try {
//     const data = zCreateAdminDto.parse(req.body);
//     const { user } = await adminService.createAdmin(data);
//     sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
//       success: true,
//       statusCode: httpStatus.CREATED,
//       message: "Admin created successfully",
//       data: { user },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "create admin");
//   }
// };
// /**
//  * login admin/superAdmin through email/phone with password.
//  */
// export const loginAdmin = async (req: Request, res: Response) => {
//   try {
//     const data = zAdminLoginDto.parse(req.body);
//     const { token, user } = await adminService.loginAdmin(data);
//     // set cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });
//     // send response
//     sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Login successful",
//       data: { token, user },
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "login admin");
//   }
// };
// /**
//  * Forgot password for admin
//  **/
// export const adminForgotPassword = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { phone } = req.body as AdminForgotPasswordDto["body"];
//     const otp = await adminService.adminForgotPassword(phone);
//     sendResponse<{ otp: string }>(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "OTP sent successfully",
//       data: { otp }, // TODO: Modify response in production
//     });
//   }
// );
// /**
//  * Reset admin password
//  **/
// export const adminResetPassword = asyncHandler(
//   async (req: Request, res: Response) => {
//     const bodyData = req.body as AdminResetPasswordDto["body"];
//     await adminService.adminResetPassword(bodyData);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Password reset successfully. Please login",
//     });
//   }
// );
// /**
//  * Delete an admin by ID
//  */
// export const deleteAdmin = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const adminId = adminIdSchema.parse(req.params.id);
//     await adminService.deleteAdmin(adminId, req.user?.userId);
//     sendResponse(res, {
//       success: true,
//       statusCode: httpStatus.OK,
//       message: "Admin deleted successfully",
//     });
//   } catch (error) {
//     handleErrorResponse(error, res, "delete admin");
//   }
// };
// --------------------------------- 2222222222222222222222222222222222 -----------------------------
/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../../utils/errorResponseHandler");
const adminService = __importStar(require("../../../modules/auth/admin/admin.service"));
const admin_dto_1 = require("../../../modules/auth/admin/admin.dto");
const zod_1 = require("zod");
const adminIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Admin ID must be a positive integer",
});
/**
 * Create admin by super admin only
 * @route POST /auth/admin
 */
const createAdmin = async (req, res) => {
    try {
        const data = admin_dto_1.zCreateAdminDto.parse(req.body);
        const { user } = await adminService.createAdmin(data);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.CREATED,
            message: "Admin created successfully",
            data: { user },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "create admin");
    }
};
exports.createAdmin = createAdmin;
/**
 * Login admin/superAdmin through email/phone with password.
 * Sets HTTP-only cookie and returns JWT token.
 *
 * @route POST /auth/admin/login
 */
const loginAdmin = async (req, res) => {
    try {
        const data = admin_dto_1.zAdminLoginDto.parse(req.body);
        const { token, user } = await adminService.loginAdmin(data);
        // Set secure HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Login successful",
            data: { token, user },
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "login admin");
    }
};
exports.loginAdmin = loginAdmin;
/**
 * Forgot password for admin
 * Initiates OTP-based password reset flow.
 *
 * @route POST /auth/admin/forgot-password
 */
const adminForgotPassword = async (req, res) => {
    try {
        const { phone } = req.body;
        const result = await adminService.adminForgotPassword(phone);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "OTP sent successfully. Please check your phone.",
            data: result,
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "admin forgot password");
    }
};
exports.adminForgotPassword = adminForgotPassword;
/**
 * Reset admin password using valid OTP
 *
 * @route POST /auth/admin/reset-password
 */
const adminResetPassword = async (req, res) => {
    try {
        const bodyData = req.body;
        await adminService.adminResetPassword(bodyData);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Password reset successfully. Please login.",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "admin reset password");
    }
};
exports.adminResetPassword = adminResetPassword;
/**
 * Delete an admin by ID
 * Only accessible by super admins.
 *
 * @route DELETE /auth/admin/:id
 */
const deleteAdmin = async (req, res) => {
    try {
        const adminId = adminIdSchema.parse(req.params.id);
        await adminService.deleteAdmin(adminId, req.user?.userId);
        (0, sendResponse_1.default)(res, {
            success: true,
            statusCode: http_status_1.default.OK,
            message: "Admin deleted successfully",
        });
    }
    catch (error) {
        (0, errorResponseHandler_1.handleErrorResponse)(error, res, "delete admin");
    }
};
exports.deleteAdmin = deleteAdmin;
