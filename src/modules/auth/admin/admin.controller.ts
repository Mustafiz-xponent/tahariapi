/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */

import httpStatus from "http-status";
import { Request, Response } from "express";
import sendResponse from "@/utils/sendResponse";
import { User } from "@/generated/prisma/client";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import * as adminService from "@/modules/auth/admin/admin.service";
import {
  AdminForgotPasswordDto,
  AdminResetPasswordDto,
  zAdminLoginDto,
  zChangePasswordDto,
  zCreateAdminDto,
  zRequestOtpDto,
  zUpdateAdminDto,
  zVerifyAdminOtpDto,
} from "@/modules/auth/admin/admin.dto";
import { z } from "zod";

const adminIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Admin ID must be a positive integer",
});

/**
 * Step 1: Create pending admin and send OTP
 * @route POST /auth/admin/create
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const data = zCreateAdminDto.parse(req.body);
    const result = await adminService.createAdmin(data);

    sendResponse<{ expiresAt: Date; otp?: string }>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message:
        "OTP sent to admin phone. Please verify to complete registration.",
      data: result,
    });
  } catch (error) {
    handleErrorResponse(error, res, "create admin");
  }
};

/**
 * Step 2: Verify OTP and set password
 * @route POST /auth/admin/verify-otp
 */
export const verifyAdminOtp = async (req: Request, res: Response) => {
  try {
    const data = zVerifyAdminOtpDto.parse(req.body);
    const { token, user } = await adminService.verifyAdminOtp(data);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin registration completed successfully.",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "verify admin OTP");
  }
};

/**
 * Update admin profile
 * @route PATCH /auth/admin/profile/:id
 */
export const updateAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = adminIdSchema.parse(req.params.id);
    const data = zUpdateAdminDto.parse(req.body);

    const user = await adminService.updateAdminProfile(
      adminId,
      data,
      req.user?.userId ? BigInt(req.user.userId) : undefined,
    );

    sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully.",
      data: { user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "update admin profile");
  }
};

/**
 * Request OTP for password change
 * @route POST /auth/admin/change-password/request-otp
 */
export const requestPasswordChangeOtp = async (req: Request, res: Response) => {
  try {
    const data = zRequestOtpDto.parse(req.body);
    const result = await adminService.requestPasswordChangeOtp(data);

    sendResponse<{ expiresAt: Date; otp?: string }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP sent successfully.",
      data: result,
    });
  } catch (error) {
    handleErrorResponse(error, res, "request password change OTP");
  }
};

/**
 * Change password with OTP
 * @route POST /auth/admin/change-password
 */
export const changeAdminPassword = async (req: Request, res: Response) => {
  try {
    const data = zChangePasswordDto.parse(req.body);
    await adminService.changeAdminPassword(data);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password changed successfully.",
    });
  } catch (error) {
    handleErrorResponse(error, res, "change admin password");
  }
};

/**
 * Create admin by super admin only
 * @route POST /auth/admin
 */
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

/**
 * Login admin/superAdmin through email/phone with password.
 * Sets HTTP-only cookie and returns JWT token.
 *
 * @route POST /auth/admin/login
 */
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const data = zAdminLoginDto.parse(req.body);
    const { token, user } = await adminService.loginAdmin(data);

    // Set secure HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "login admin");
  }
};

/**
 * Forgot password for admin
 * Initiates OTP-based password reset flow.
 *
 * @route POST /auth/admin/forgot-password
 */
export const adminForgotPassword = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as AdminForgotPasswordDto["body"];
    const result = await adminService.adminForgotPassword(phone);

    sendResponse<{ expiresAt: Date; otp?: string }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP sent successfully. Please check your phone.",
      data: result,
    });
  } catch (error) {
    handleErrorResponse(error, res, "admin forgot password");
  }
};

/**
 * Reset admin password using valid OTP
 *
 * @route POST /auth/admin/reset-password
 */
export const adminResetPassword = async (req: Request, res: Response) => {
  try {
    const bodyData = req.body as AdminResetPasswordDto["body"];
    await adminService.adminResetPassword(bodyData);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password reset successfully. Please login.",
    });
  } catch (error) {
    handleErrorResponse(error, res, "admin reset password");
  }
};

/**
 * Delete an admin by ID
 * Only accessible by super admins.
 *
 * @route DELETE /auth/admin/:id
 */
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const adminId = adminIdSchema.parse(req.params.id);
    await adminService.deleteAdmin(adminId, req.user?.userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete admin");
  }
};
