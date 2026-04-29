// /**
//  * Service layer for Admin authentication operations.
//  * Handles admin creation by super admins and login.
//  */
// import bcrypt from "bcrypt";
// import httpStatus from "http-status";
// import { AppError } from "@/utils/appError";
// import prisma from "@/prisma-client/prismaClient";
// import { generateAuthToken } from "@/utils/authToken";
// import { getErrorMessage } from "@/utils/errorHandler";
// import { sendOtp, verifyOtp } from "@/utils/otpService";
// import { User, UserRole } from "@/generated/prisma/client";
// import {
//   AdminForgotPasswordDto,
//   AdminLoginDto,
//   AdminResetPasswordDto,
//   CreateAdminDto,
// } from "@/modules/auth/admin/admin.dto";

// const SALT_ROUNDS = 10;

// /**
//  * Create admin by super admin only
//  */
// export async function createAdmin(
//   data: CreateAdminDto
// ): Promise<{ user: Omit<User, "passwordHash"> }> {
//   try {
//     // Check if email or phone already exists
//     const existingUser = await prisma.user.findFirst({
//       where: {
//         OR: [{ email: data.email }, { phone: data.phone }],
//       },
//     });

//     if (existingUser) {
//       throw new Error(
//         existingUser.email === data.email
//           ? "Email already registered"
//           : "Phone number already registered"
//       );
//     }

//     const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

//     const user = await prisma.user.create({
//       data: {
//         email: data.email,
//         phone: data.phone,
//         name: data.name,
//         address: data.address || [],
//         passwordHash,
//         role: "ADMIN",
//         status: "ACTIVE",
//         admin: { create: {} },
//       },
//     });

//     const { passwordHash: _, ...userData } = user;
//     return { user: userData };
//   } catch (error) {
//     throw new Error(`Failed to create admin: ${getErrorMessage(error)}`);
//   }
// }

// /**
//  * login admin/superAdmin through email/phone with password.
//  */
// export async function loginAdmin(
//   data: AdminLoginDto
// ): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
//   try {
//     // Validate input
//     if (!data.password) throw new Error("Password is required");
//     if (!data.email && !data.phone) {
//       throw new Error("Email or phone is required");
//     }

//     // Determine identifier
//     const identifier = data.email
//       ? { email: data.email }
//       : { phone: data.phone! };

//     // Find user
//     const user = await prisma.user.findUnique({
//       where: identifier,
//       include: { admin: true },
//     });

//     // Validate user
//     if (!user) throw new Error("Invalid credentials");
//     if (!user.passwordHash) throw new Error("Password not set yet");
//     if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
//       throw new Error("Invalid credentials");
//     }
//     const { passwordHash: _, ...userData } = user;
//     // Verify password
//     const isValid = await bcrypt.compare(data.password, user.passwordHash);
//     if (!isValid) throw new Error("Invalid credentials");

//     // Generate token
//     return generateAuthToken(userData);
//   } catch (error) {
//     throw new Error(`Failed to login admin: ${getErrorMessage(error)}`);
//   }
// }

// /**
//  *
//  */
// export const adminForgotPassword = async (
//   phone: AdminForgotPasswordDto["body"]["phone"]
// ) => {
//   // check user exits or not
//   const user = await prisma.user.findUnique({
//     where: { phone: phone },
//     select: { userId: true },
//   });
//   if (!user) {
//     throw new AppError("User not found", httpStatus.NOT_FOUND);
//   }
//   // send otp via sms
//   const res = await sendOtp(phone);
//   return res.otp; // TODO: Need to remove this line when in production
// };

// /**
//  * Resets an admin's password using a valid OTP sent to their phone.
//  * @throws {AppError} If the OTP is invalid or has expired
//  * @throws {AppError} If the user is not found
//  */
// export const adminResetPassword = async (
//   bodyData: AdminResetPasswordDto["body"]
// ) => {
//   const { otp, phone, password } = bodyData;
//   const now = new Date();
//   // Check OTP exits or not
//   const otpRecord = await prisma.otp.findFirst({
//     where: { phone, expiresAt: { gt: now } },
//     orderBy: { createdAt: "desc" },
//   });

//   if (!otpRecord) {
//     throw new AppError("Your OTP is not valid", httpStatus.UNAUTHORIZED);
//   }
//   // Check is OTP valid or not
//   const isValidOtp = await verifyOtp(phone, otp);
//   if (!isValidOtp) {
//     throw new AppError("Your OTP is not valid", httpStatus.UNAUTHORIZED);
//   }

//   // Check user exits or not
//   const user = await prisma.user.findUnique({
//     where: { phone: phone },
//     select: { userId: true, role: true, passwordHash: true },
//   });

//   if (!user) {
//     throw new AppError("User not found", httpStatus.NOT_FOUND);
//   }
//   // Check user role is ADMIN | SUPER_ADMIN | SUPPORT
//   const validRoles: UserRole[] = [
//     UserRole.ADMIN,
//     UserRole.SUPER_ADMIN,
//     UserRole.SUPPORT,
//   ];
//   if (!validRoles.includes(user.role)) {
//     throw new AppError("You are not permitted", httpStatus.UNAUTHORIZED);
//   }
//   // Check user current password is same as new password
//   const isValidPassword = await bcrypt.compare(password, user.passwordHash!);
//   if (isValidPassword) {
//     throw new AppError(
//       "New password cannot be the same as the current password",
//       httpStatus.BAD_REQUEST
//     );
//   }
//   // Update password
//   const SALT_ROUNDS = 10;
//   await prisma.otp.deleteMany({
//     where: { phone: phone },
//   });
//   const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
//   await prisma.user.update({
//     where: { phone: phone },
//     data: { passwordHash },
//   });
//   // Delete all OTP records for the user
//   await prisma.otp.deleteMany({
//     where: { phone: phone },
//   });
// };
// /**
//  * Delete an admin by ID
//  * @param adminId The ID of the admin to delete
//  * @param requestingUserId The ID of the superAdmin making the request
//  * @throws Error if admin not found or if trying to delete self
//  */
// export const deleteAdmin = async (
//   adminId: bigint,
//   requestingUserId?: string
// ): Promise<User> => {
//   try {
//     // Prevent self-deletion
//     if (requestingUserId && BigInt(requestingUserId) === adminId) {
//       throw new Error("SuperAdmin cannot delete themselves");
//     }

//     return await prisma.$transaction(async (prisma) => {
//       // Verify admin exists and is not a superAdmin
//       const adminToDelete = await prisma.user.findUnique({
//         where: { userId: Number(adminId) },
//         include: { admin: true },
//       });

//       if (!adminToDelete) {
//         throw new Error("Admin not found");
//       }

//       if (adminToDelete.role === "SUPER_ADMIN") {
//         throw new Error("Cannot delete a superAdmin");
//       }

//       // Delete the admin record first if it exists
//       if (adminToDelete.admin) {
//         await prisma.admin.delete({
//           where: { userId: Number(adminId) },
//         });
//       }

//       // Then delete the user
//       return await prisma.user.delete({
//         where: { userId: Number(adminId) },
//       });
//     });
//   } catch (error) {
//     throw new Error(`Error deleting admin: ${getErrorMessage(error)}`);
//   }
// };

// -------------------------------- 22222222222222222222222222222222222 -------------------------------
// src/modules/auth/admin/admin.service.ts
/**
 * Service layer for Admin authentication operations.
 * Handles admin creation by super admins and login.
 */

import bcrypt from "bcrypt";
import axios from "axios";
import crypto from "crypto";
import httpStatus from "http-status";
import { AppError } from "@/utils/appError";
import prisma from "@/prisma-client/prismaClient";
import { generateAuthToken } from "@/utils/authToken";
import { getErrorMessage } from "@/utils/errorHandler";
import { User, UserRole } from "@/generated/prisma/client";
import logger from "@/utils/logger";
import {
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
  CreateAdminDto,
} from "@/modules/auth/admin/admin.dto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Bcrypt salt rounds for password hashing */
const SALT_ROUNDS = 10;

/** Bcrypt salt rounds for OTP hashing */
const OTP_HASH_SALT_ROUNDS = 10;

/** OTP validity duration in minutes */
const OTP_EXPIRY_MINUTES = 5;

/** Number of digits in the generated OTP */
const OTP_LENGTH = 6;

/** Minimum seconds between OTP requests for the same phone number */
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ---------------------------------------------------------------------------
// OTP Helpers (private)
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically secure numeric OTP.
 *
 * @param length - Number of digits (default: OTP_LENGTH)
 * @returns Zero-padded numeric OTP string
 */
function generateOtp(length: number = OTP_LENGTH): string {
  const max = Math.pow(10, length);
  const randomNumber = crypto.randomBytes(4).readUInt32BE(0) % max;
  return randomNumber.toString().padStart(length, "0");
}

/**
 * Computes the OTP expiry timestamp from the current time.
 *
 * @returns Date object representing when the OTP will expire
 */
function computeExpiryTime(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Builds the SMS message body for OTP delivery.
 *
 * @param otp - Plaintext OTP code
 * @returns Formatted SMS message string
 */
function buildOtpMessage(otp: string): string {
  return (
    `Your verification code is: ${otp}. ` +
    `Valid for ${OTP_EXPIRY_MINUTES} minutes. ` +
    `Do not share this code with anyone.`
  );
}

// ---------------------------------------------------------------------------
// SMS Helper (private)
// ---------------------------------------------------------------------------

/**
 * Validates and retrieves SMS provider configuration from environment variables.
 *
 * @throws Error if any required environment variable is missing
 */
function getSmsConfig(): {
  apiUrl: string;
  apiKey: string;
  senderId: string;
} {
  const apiUrl = process.env.SMS_API_URL;
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID;

  if (!apiUrl || !apiKey || !senderId) {
    throw new Error(
      "SMS configuration is incomplete. " +
        "Ensure SMS_API_URL, SMS_API_KEY, and SMS_SENDER_ID are set.",
    );
  }

  return { apiUrl, apiKey, senderId };
}

/**
 * Normalizes a phone number for the SMS gateway.
 * Strips the leading '+' as the gateway expects format: 8801XXXXXXXXX
 *
 * @param phone - Phone number in +8801XXXXXXXXX format
 * @returns Phone number without leading '+'
 */
function normalizePhone(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

/**
 * Delivers an SMS message to the given phone number via the SMS gateway.
 *
 * @param phone   - Recipient phone in +8801XXXXXXXXX format
 * @param message - Plaintext SMS body
 * @throws Error if the HTTP request fails
 */
async function sendSms(phone: string, message: string): Promise<void> {
  const { apiUrl, apiKey, senderId } = getSmsConfig();

  const normalizedPhone = normalizePhone(phone);
  const encodedMessage = encodeURIComponent(message);

  const requestUrl =
    `${apiUrl}` +
    `?api_key=${apiKey}` +
    `&type=text` +
    `&phone=${normalizedPhone}` +
    `&senderid=${senderId}` +
    `&message=${encodedMessage}`;

  logger.info(`[SMS] Sending to ${normalizedPhone}...`);

  const response = await axios.get(requestUrl, {
    timeout: 10_000,
  });

  logger.info(`[SMS] Gateway response:`, {
    status: response.status,
    data: response.data,
  });
}

// ---------------------------------------------------------------------------
// OTP Core (private)
// ---------------------------------------------------------------------------

/**
 * Generates, hashes, persists, and delivers an OTP to the given phone number.
 *
 * Flow:
 *  1. Enforce resend cooldown
 *  2. Invalidate all previously active OTPs for this phone
 *  3. Generate a cryptographically secure OTP and hash it with bcrypt
 *  4. Persist the hashed OTP record
 *  5. Deliver the plaintext OTP via SMS
 *
 * @param phone - Recipient phone number in +8801XXXXXXXXX format
 * @returns OTP expiry time and raw OTP (non-production only)
 * @throws Error if cooldown is active or SMS delivery fails
 */
async function processAndSendOtp(
  phone: string,
): Promise<{ expiresAt: Date; otp?: string }> {
  // ── 1. Enforce resend cooldown ──────────────────────────────────────────
  const cooldownThreshold = new Date(
    Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000,
  );

  const recentOtp = await prisma.otp.findFirst({
    where: {
      phone,
      createdAt: { gt: cooldownThreshold },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const elapsedSeconds = Math.floor(
      (Date.now() - recentOtp.createdAt.getTime()) / 1000,
    );
    const remainingSeconds = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    throw new Error(
      `Please wait ${remainingSeconds} second(s) before requesting a new OTP.`,
    );
  }

  // ── 2. Invalidate all previously active OTPs for this phone ────────────
  await prisma.otp.deleteMany({
    where: {
      phone,
      expiresAt: { gt: new Date() },
    },
  });

  // ── 3. Generate OTP and hash it ────────────────────────────────────────
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, OTP_HASH_SALT_ROUNDS);
  const expiresAt = computeExpiryTime();

  // ── 4. Persist hashed OTP record ───────────────────────────────────────
  await prisma.otp.create({
    data: {
      phone,
      otpHash,
      expiresAt,
    },
  });

  logger.info(
    `[OTP] Generated for ${phone}. Expires at ${expiresAt.toISOString()}`,
  );

  // ── 5. Deliver OTP via SMS ─────────────────────────────────────────────
  try {
    const message = buildOtpMessage(otp);
    await sendSms(phone, message);
    logger.info(`[OTP] SMS delivered to ${phone}.`);
  } catch (smsError) {
    logger.error(
      `[OTP] SMS delivery failed for ${phone}: ${
        smsError instanceof Error ? smsError.message : "Unknown error"
      }`,
    );
    if (process.env.NODE_ENV !== "production") {
      logger.warn(`[OTP] DEV FALLBACK — OTP for ${phone}: ${otp}`);
    }
  }

  return {
    expiresAt,
    ...(process.env.NODE_ENV !== "production" && { otp }),
  };
}

/**
 * Verifies a submitted OTP against the stored bcrypt hash.
 *
 * Flow:
 *  1. Fetch the most recent unexpired OTP record for this phone
 *  2. Throw if no valid record is found
 *  3. Compare submitted OTP against the stored bcrypt hash
 *  4. On match  — delete the record to enforce single-use
 *  5. On mismatch — throw with a descriptive error message
 *
 * @param phone - Phone number in +8801XXXXXXXXX format
 * @param otp   - Plaintext OTP submitted by the user
 * @returns true if verification succeeds
 * @throws Error if OTP is not found, expired, or does not match
 */
async function validateOtp(phone: string, otp: string): Promise<boolean> {
  // ── 1. Fetch most recent unexpired OTP record ──────────────────────────
  const otpRecord = await prisma.otp.findFirst({
    where: {
      phone,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  // ── 2. Guard: no valid record found ────────────────────────────────────
  if (!otpRecord) {
    throw new AppError(
      "OTP not found or has expired. Please request a new OTP.",
      httpStatus.UNAUTHORIZED,
    );
  }

  // ── 3. Compare submitted OTP against bcrypt hash ───────────────────────
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);

  // ── 4. On mismatch — throw descriptive error ───────────────────────────
  if (!isMatch) {
    logger.warn(`[OTP] Invalid OTP attempt for ${phone}.`);
    throw new AppError(
      "Invalid OTP. Please check the code and try again.",
      httpStatus.UNAUTHORIZED,
    );
  }

  // ── 5. Delete record — enforce single-use ─────────────────────────────
  await prisma.otp.delete({
    where: { otpId: otpRecord.otpId },
  });

  logger.info(`[OTP] Verified successfully for ${phone}.`);

  return true;
}

// ---------------------------------------------------------------------------
// Admin Management
// ---------------------------------------------------------------------------

/**
 * Create admin by super admin only.
 *
 * @param data - Validated create admin DTO
 * @returns Created user object without passwordHash
 * @throws Error if email or phone already registered
 */
export async function createAdmin(
  data: CreateAdminDto,
): Promise<{ user: Omit<User, "passwordHash"> }> {
  try {
    // Check if email or phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new Error(
        existingUser.email === data.email
          ? "Email already registered."
          : "Phone number already registered.",
      );
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
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
  } catch (error) {
    throw new Error(`Failed to create admin: ${getErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Admin Login
// ---------------------------------------------------------------------------

/**
 * Login admin/superAdmin through email/phone with password.
 *
 * @param data - Validated login DTO
 * @returns JWT token and sanitized user object
 * @throws Error if credentials are invalid
 */
export async function loginAdmin(
  data: AdminLoginDto,
): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
  try {
    if (!data.password) throw new Error("Password is required.");
    if (!data.email && !data.phone) {
      throw new Error("Email or phone is required.");
    }

    const identifier = data.email
      ? { email: data.email }
      : { phone: data.phone! };

    const user = await prisma.user.findUnique({
      where: identifier,
      include: { admin: true },
    });

    if (!user) throw new Error("Invalid credentials.");
    if (!user.passwordHash) throw new Error("Password not set yet.");
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("Invalid credentials.");
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) throw new Error("Invalid credentials.");

    const { passwordHash: _, ...userData } = user;

    logger.info(`[Admin] Login successful: ${user.phone}`);

    return generateAuthToken(userData);
  } catch (error) {
    throw new Error(`Failed to login admin: ${getErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------

/**
 * Send OTP to admin phone for password reset.
 *
 * @param phone - Admin phone number in +8801XXXXXXXXX format
 * @returns OTP expiry time and raw OTP (non-production only)
 * @throws AppError if user not found
 */
export const adminForgotPassword = async (
  phone: AdminForgotPasswordDto["body"]["phone"],
): Promise<{ expiresAt: Date; otp?: string }> => {
  // ── Check user exists ──────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { userId: true },
  });

  if (!user) {
    throw new AppError("User not found.", httpStatus.NOT_FOUND);
  }

  // ── Send OTP ───────────────────────────────────────────────────────────
  const { expiresAt, otp } = await processAndSendOtp(phone);

  logger.info(`[Admin] Forgot password OTP sent to ${phone}.`);

  return { expiresAt, otp };
};

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------

/**
 * Reset admin password using a valid OTP.
 *
 * @param bodyData - Validated reset password DTO (phone, otp, password)
 * @throws AppError if OTP is invalid, user not found, or role is not permitted
 */
export const adminResetPassword = async (
  bodyData: AdminResetPasswordDto["body"],
): Promise<void> => {
  const { otp, phone, password } = bodyData;

  // ── Validate OTP ───────────────────────────────────────────────────────
  // validateOtp throws descriptive AppError on failure
  await validateOtp(phone, otp);

  // ── Check user exists ──────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { phone },
    select: { userId: true, role: true, passwordHash: true },
  });

  if (!user) {
    throw new AppError("User not found.", httpStatus.NOT_FOUND);
  }

  // ── Validate role ──────────────────────────────────────────────────────
  const validRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT,
  ];

  if (!validRoles.includes(user.role)) {
    throw new AppError(
      "You are not permitted to perform this action.",
      httpStatus.FORBIDDEN,
    );
  }

  // ── Ensure new password differs from current ───────────────────────────
  const isSamePassword = await bcrypt.compare(password, user.passwordHash!);
  if (isSamePassword) {
    throw new AppError(
      "New password cannot be the same as the current password.",
      httpStatus.BAD_REQUEST,
    );
  }

  // ── Update password ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.user.update({
    where: { phone },
    data: { passwordHash },
  });

  // OTP record already deleted inside validateOtp — no cleanup needed here
  logger.info(`[Admin] Password reset successfully for ${phone}.`);
};

// ---------------------------------------------------------------------------
// Delete Admin
// ---------------------------------------------------------------------------

/**
 * Delete an admin by ID.
 * Only super admins can delete admins.
 * Super admins cannot delete themselves.
 *
 * @param adminId           - ID of the admin to delete
 * @param requestingUserId  - ID of the super admin making the request
 * @throws Error if admin not found or trying to delete self or super admin
 */
export const deleteAdmin = async (
  adminId: bigint,
  requestingUserId?: string,
): Promise<User> => {
  try {
    // ── Prevent self-deletion ──────────────────────────────────────────────
    if (requestingUserId && BigInt(requestingUserId) === adminId) {
      throw new Error("Super admin cannot delete themselves.");
    }

    return await prisma.$transaction(async (prisma) => {
      // ── Verify admin exists ──────────────────────────────────────────────
      const adminToDelete = await prisma.user.findUnique({
        where: { userId: Number(adminId) },
        include: { admin: true },
      });

      if (!adminToDelete) {
        throw new Error("Admin not found.");
      }

      if (adminToDelete.role === "SUPER_ADMIN") {
        throw new Error("Cannot delete a super admin.");
      }

      // ── Delete admin record first ────────────────────────────────────────
      if (adminToDelete.admin) {
        await prisma.admin.delete({
          where: { userId: Number(adminId) },
        });
      }

      // ── Delete user record ───────────────────────────────────────────────
      return await prisma.user.delete({
        where: { userId: Number(adminId) },
      });
    });
  } catch (error) {
    throw new Error(`Error deleting admin: ${getErrorMessage(error)}`);
  }
};
