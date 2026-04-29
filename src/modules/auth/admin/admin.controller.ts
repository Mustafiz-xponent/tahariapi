// /**
//  * Controller layer for Admin authentication operations.
//  * Handles HTTP requests and responses for admin authentication endpoints.
//  */
// import { z } from "zod";
// import httpStatus from "http-status";
// import { Request, Response } from "express";
// import asyncHandler from "@/utils/asyncHandler";
// import sendResponse from "@/utils/sendResponse";
// import { User } from "@/generated/prisma/client";
// import { handleErrorResponse } from "@/utils/errorResponseHandler";
// import * as adminService from "@/modules/auth/admin/admin.service";
// import {
//   AdminForgotPasswordDto,
//   AdminResetPasswordDto,
//   zAdminLoginDto,
//   zCreateAdminDto,
// } from "@/modules/auth/admin/admin.dto";

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
  zCreateAdminDto,
} from "@/modules/auth/admin/admin.dto";
import { z } from "zod";

const adminIdSchema = z.coerce.bigint().refine((val) => val > 0n, {
  message: "Admin ID must be a positive integer",
});

/**
 * Create admin by super admin only
 * @route POST /auth/admin
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
