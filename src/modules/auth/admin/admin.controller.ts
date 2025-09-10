/**
 * Controller layer for Admin authentication operations.
 * Handles HTTP requests and responses for admin authentication endpoints.
 */
import { z } from "zod";
import httpStatus from "http-status";
import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import { User } from "@/generated/prisma/client";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import * as adminService from "@/modules/auth/admin/admin.service";
import {
  AdminForgotPasswordDto,
  AdminResetPasswordDto,
  zAdminLoginDto,
  zCreateAdminDto,
} from "@/modules/auth/admin/admin.dto";

const adminIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Admin ID must be a positive integer",
});

/**
 * Create admin by super admin only
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const data = zCreateAdminDto.parse(req.body);
    const { user } = await adminService.createAdmin(data);
    sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Admin created successfully",
      data: { user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "create admin");
  }
};

/**
 * login admin/superAdmin through email/phone with password.
 */
export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const data = zAdminLoginDto.parse(req.body);
    const { token, user } = await adminService.loginAdmin(data);
    // set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    // send response
    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin logged in successfully",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "login admin");
  }
};
/**
 * Forgot password for admin
 **/
export const adminForgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { phone } = req.body as AdminForgotPasswordDto["body"];
    const otp = await adminService.adminForgotPassword(phone);

    sendResponse<{ otp: string }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP sent successfully",
      data: { otp }, // TODO: Modify response in production
    });
  }
);
/**
 * Reset admin password
 **/
export const adminResetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const bodyData = req.body as AdminResetPasswordDto["body"];
    await adminService.adminResetPassword(bodyData);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password reset successfully. Please login",
    });
  }
);
/**
 * Delete an admin by ID
 */
export const deleteAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const adminId = adminIdSchema.parse(req.params.id);
    await adminService.deleteAdmin(adminId, req.user?.userId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin deleted successfully",
      data: null,
    });
  } catch (error) {
    handleErrorResponse(error, res, "delete admin");
  }
};
