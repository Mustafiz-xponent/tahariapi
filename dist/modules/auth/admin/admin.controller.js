"use strict";
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
/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */
const zod_1 = require("zod");
const http_status_1 = __importDefault(require("http-status"));
const asyncHandler_1 = __importDefault(require("../../../utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const errorResponseHandler_1 = require("../../../utils/errorResponseHandler");
const adminService = __importStar(require("../../../modules/auth/admin/admin.service"));
const admin_dto_1 = require("../../../modules/auth/admin/admin.dto");
const adminIdSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "Admin ID must be a positive integer",
});
/**
 * Create admin by super admin only
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
 * login admin/superAdmin through email/phone with password.
 */
const loginAdmin = async (req, res) => {
    try {
        const data = admin_dto_1.zAdminLoginDto.parse(req.body);
        const { token, user } = await adminService.loginAdmin(data);
        // set cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        // send response
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
 **/
exports.adminForgotPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const { phone } = req.body;
    const otp = await adminService.adminForgotPassword(phone);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "OTP sent successfully",
        data: { otp }, // TODO: Modify response in production
    });
});
/**
 * Reset admin password
 **/
exports.adminResetPassword = (0, asyncHandler_1.default)(async (req, res) => {
    const bodyData = req.body;
    await adminService.adminResetPassword(bodyData);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Password reset successfully. Please login",
    });
});
/**
 * Delete an admin by ID
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
