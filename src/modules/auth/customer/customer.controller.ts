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

import httpStatus from "http-status";
import { Request, Response } from "express";
import sendResponse from "@/utils/sendResponse";
import { User } from "@/generated/prisma/client";
import { handleErrorResponse } from "@/utils/errorResponseHandler";
import * as customerService from "@/modules/auth/customer/customer.service";
import {
  zCustomerIdParam,
  zCustomerLoginDto,
  zCustomerOtpLoginDto,
  zCustomerRegisterDto,
  zCustomerUpdateProfileDto,
  zCustomerVerifyOtpDto,
} from "@/modules/auth/customer/customer.dto";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a new customer with phone number.
 * Sends a verification OTP to the provided phone number upon success.
 *
 * @route POST /auth/customer/register
 */
export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerRegisterDto.parse(req.body);
    const { expiresAt, otp } = await customerService.registerCustomer(data);

    sendResponse<{ expiresAt: Date; otp?: string }>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Registration successful. OTP sent to your phone.",
      data: { expiresAt, otp },
    });
  } catch (error) {
    handleErrorResponse(error, res, "register customer");
  }
};

// ---------------------------------------------------------------------------
// Password Login
// ---------------------------------------------------------------------------

/**
 * Login customer with email/phone and password.
 * Returns a JWT token and sanitized user object on success.
 *
 * @route POST /auth/customer/login
 */
export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerLoginDto.parse(req.body);
    const { token, user } = await customerService.loginCustomer(data);

    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Login successful.",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "login customer");
  }
};

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
export const otpLoginCustomer = async (req: Request, res: Response) => {
  try {
    const data = zCustomerOtpLoginDto.parse(req.body);
    const { expiresAt, otp } = await customerService.otpLoginCustomer(data);

    sendResponse<{ expiresAt: Date; otp?: string }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP sent successfully. Please check your phone.",
      data: { expiresAt, otp },
    });
  } catch (error) {
    handleErrorResponse(error, res, "OTP login");
  }
};

// ---------------------------------------------------------------------------
// OTP Verification
// ---------------------------------------------------------------------------

/**
 * Verify customer OTP and complete authentication.
 * Activates the user account and returns a JWT token on success.
 *
 * @route POST /auth/customer/verify-otp
 */
export const verifyCustomerOtp = async (req: Request, res: Response) => {
  try {
    const data = zCustomerVerifyOtpDto.parse(req.body);
    const { token, user } = await customerService.verifyCustomerOtp(data);

    sendResponse<{ token: string; user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "OTP verified successfully.",
      data: { token, user },
    });
  } catch (error) {
    handleErrorResponse(error, res, "verify OTP");
  }
};

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
export const updateCustomerProfile = async (req: Request, res: Response) => {
  try {
    const requestingUserId = req.user?.userId;
    if (!requestingUserId) {
      throw new Error("Authentication required.");
    }

    const customerId = zCustomerIdParam.parse(req.params.id);

    // Ensure the authenticated user can only update their own profile
    if (customerId !== BigInt(requestingUserId)) {
      throw new Error("You can only update your own profile.");
    }

    const data = zCustomerUpdateProfileDto.parse(req.body);
    const updatedUser = await customerService.updateCustomerProfile(
      customerId,
      data,
    );

    // Exclude sensitive fields from the response
    const { passwordHash, ...sanitizedUser } = updatedUser;

    sendResponse<{ user: Omit<User, "passwordHash"> }>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully.",
      data: { user: sanitizedUser },
    });
  } catch (error) {
    handleErrorResponse(error, res, "update customer profile");
  }
};

/**
 * Get customer profile by ID.
 * Only the authenticated customer can retrieve their own profile.
 *
 * @route GET /auth/customer/:id
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const requestingUserId = req.user?.userId;
    if (!requestingUserId) {
      throw new Error("Authentication required.");
    }

    const customerId = zCustomerIdParam.parse(req.params.id);

    // Ensure the authenticated user can only access their own profile
    if (BigInt(requestingUserId) !== customerId) {
      throw new Error("You can only access your own profile.");
    }

    const customer = await customerService.getCustomerById(customerId);

    sendResponse<Omit<User, "passwordHash">>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Customer retrieved successfully.",
      data: customer,
    });
  } catch (error) {
    handleErrorResponse(error, res, "get customer by ID");
  }
};
