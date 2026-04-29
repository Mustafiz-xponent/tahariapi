// /**
//  * Service layer for Customer authentication operations.
//  * Handles registration, login, OTP generation, verification, and JWT issuance for customers.
//  */
// import bcrypt from "bcrypt";
// import logger from "@/utils/logger";
// import { User } from "@/generated/prisma/client";
// import prisma from "@/prisma-client/prismaClient";
// import { generateAuthToken } from "@/utils/authToken";
// import { getErrorMessage } from "@/utils/errorHandler";
// import { sendOtp, verifyOtp } from "@/utils/otpService";
// import {
//   CustomerLoginDto,
//   CustomerOtpLoginDto,
//   CustomerRegisterDto,
//   CustomerUpdateProfileDto,
//   CustomerVerifyOtpDto,
// } from "@/modules/auth/customer/customer.dto";

// /**
//  * Register new customer with phone number
//  */
// export async function registerCustomer(
//   data: CustomerRegisterDto
// ): Promise<{ user: Omit<User, "passwordHash"> }> {
//   try {
//     // Validate phone number uniqueness
//     const existingUser = await prisma.user.findUnique({
//       where: { phone: data.phone },
//     });
//     if (existingUser) {
//       throw new Error("Phone number already registered");
//     }

//     // Hash the password before storing
//     const saltRounds = 10;
//     const passwordHash = data.password
//       ? await bcrypt.hash(data.password, saltRounds)
//       : null;

//     // Create user record with hashed password
//     const user = await prisma.user.create({
//       data: {
//         phone: data.phone,
//         name: data.name,
//         address: data.address || [],
//         passwordHash: passwordHash,
//         role: "CUSTOMER",
//         status: "PENDING",
//         customer: { create: {} },
//       },
//     });

//     // Send verification OTP
//     await sendOtp(data.phone);

//     // Return user data without sensitive fields
//     const { passwordHash: _, ...userData } = user;
//     return { user: userData };
//   } catch (error) {
//     throw new Error(`Failed to register customer: ${getErrorMessage(error)}`);
//   }
// }

// /**
//  * Login customer with email/phone and password
//  */
// export async function loginCustomer(
//   data: CustomerLoginDto
// ): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
//   // Determine identifier (email or phone)
//   const identifier = data.email
//     ? { email: data.email }
//     : { phone: data.phone! };

//   const user = await prisma.user.findUnique({
//     where: identifier,
//   });

//   if (!user || user.role !== "CUSTOMER") {
//     throw new Error("Customer not found");
//   }

//   if (!user.passwordHash) {
//     throw new Error("Password login not enabled for this account");
//   }

//   const isValid = await bcrypt.compare(data.password, user.passwordHash);
//   if (!isValid) {
//     throw new Error("Invalid password");
//   }

//   return generateAuthToken(user);
// }

// /**
//  * OTP login customer
//  */
// export async function otpLoginCustomer(
//   data: CustomerOtpLoginDto
// ): Promise<string> {
//   await prisma.user.upsert({
//     where: { phone: data.phone },
//     update: {}, // No updates needed if user exists
//     create: {
//       phone: data.phone,
//       role: "CUSTOMER",
//       status: "PENDING",
//       customer: { create: {} },
//     },
//   });

//   const res = await sendOtp(data.phone);
//   return res.otp; // TODO: Need to remove this line when in production
// }

// /**
//  * Verify OTP
//  */
// export async function verifyCustomerOtp(
//   data: CustomerVerifyOtpDto
// ): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
//   const otpRecord = await prisma.otp.findFirst({
//     where: { phone: data.phone, expiresAt: { gt: new Date() } },
//     orderBy: { createdAt: "desc" },
//   });
//   logger.info("OTP record:", otpRecord);

//   if (!otpRecord || otpRecord.expiresAt < new Date()) {
//     throw new Error("Invalid or expired OTP");
//   }

//   const isValidOtp = await verifyOtp(data.phone, data.otp);
//   if (!isValidOtp) {
//     throw new Error("Invalid OTP");
//   }

//   const user = await prisma.user.findUnique({
//     where: { phone: data.phone },
//     include: {
//       customer: {
//         include: {
//           wallet: true,
//         },
//       },
//     },
//   });

//   if (!user || user.role !== "CUSTOMER") {
//     throw new Error("Customer not found");
//   }
//   // create customer wallet if not exist--
//   if (user.customer && !user.customer.wallet) {
//     await prisma.wallet.create({
//       data: {
//         customerId: user.customer.customerId,
//       },
//     });
//   }

//   const updatedUser = await prisma.user.update({
//     where: { phone: data.phone },
//     data: { status: "ACTIVE" },
//     include: {
//       customer: {
//         select: {
//           customerId: true,
//           wallet: { select: { walletId: true } },
//         },
//       },
//     },
//   });
//   // Delete all OTP records for the user after successful verification
//   await prisma.otp.deleteMany({
//     where: { phone: data.phone },
//   });

//   return generateAuthToken(updatedUser);
// }

// /**
//  * Update customer profile
//  */
// export async function updateCustomerProfile(
//   userId: bigint,
//   data: CustomerUpdateProfileDto
// ): Promise<User> {
//   const updateData: {
//     name?: string;
//     email?: string;
//     address?: string[];
//     passwordHash?: string;
//     updatedAt?: Date;
//   } = {
//     updatedAt: new Date(), // Always update the updatedAt field
//   };

//   if (data.name) updateData.name = data.name;
//   if (data.email) updateData.email = data.email;
//   if (data.address) updateData.address = data.address;

//   // Handle password update with hashing
//   if (data.password) {
//     const saltRounds = 10;
//     updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
//   }

//   // Check if any fields were actually provided (beyond updatedAt)
//   const hasUpdates = Object.keys(updateData).some(
//     (key) =>
//       key !== "updatedAt" &&
//       updateData[key as keyof typeof updateData] !== undefined
//   );

//   if (!hasUpdates) {
//     throw new Error("No valid fields provided for update");
//   }

//   return await prisma.user.update({
//     where: { userId },
//     data: updateData,
//   });
// }

// /**
//  * Get customer by ID
//  * @throws Error if customer not found or unauthorized
//  */
// export async function getCustomerById(
//   userId: bigint
// ): Promise<Omit<User, "passwordHash">> {
//   const user = await prisma.user.findUnique({
//     where: { userId },
//     include: { customer: true },
//   });

//   if (!user) {
//     throw new Error("Customer not found");
//   }
//   if (user.role !== "CUSTOMER") {
//     throw new Error("User is not a customer");
//   }

//   const { passwordHash, ...customerData } = user;
//   return customerData;
// }

// ------------------------------------ 22222222222222222222222222222 -----------------------------------
// src/modules/auth/customer/customer.service.ts
/**
 * Service layer for Customer authentication operations.
 * Handles registration, login, OTP flow, profile management, and JWT issuance.
 * OTP generation, hashing, SMS delivery are handled inline within this service.
 */

import bcrypt from "bcrypt";
import axios from "axios";
import crypto from "crypto";
import logger from "@/utils/logger";
import { User } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { generateAuthToken } from "@/utils/authToken";
import { getErrorMessage } from "@/utils/errorHandler";
import {
  CustomerLoginDto,
  CustomerOtpLoginDto,
  CustomerRegisterDto,
  CustomerUpdateProfileDto,
  CustomerVerifyOtpDto,
} from "@/modules/auth/customer/customer.dto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Bcrypt salt rounds for password hashing */
const PASSWORD_SALT_ROUNDS = 10;

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
 * Uses crypto.randomBytes instead of Math.random for better entropy.
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
 * @returns Validated SMS configuration object
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
 * @example
 *   normalizePhone("+8801711584519") → "8801711584519"
 *
 * @param phone - Phone number in +8801XXXXXXXXX format
 * @returns Phone number without leading '+'
 */
function normalizePhone(phone: string): string {
  return phone.startsWith("+") ? phone.slice(1) : phone;
}

/**
 * Delivers an OTP message to the given phone number via the SMS gateway.
 *
 * API format:
 *   GET {SMS_API_URL}?api_key=...&type=text&phone=...&senderid=...&message=...
 *
 * The message is URL-encoded to safely transmit special characters
 * such as &, $, @ as required by the SMS provider documentation.
 *
 * @param phone   - Recipient phone in +8801XXXXXXXXX format
 * @param message - Plaintext SMS body
 * @throws Error if the HTTP request fails
 */
// async function sendSms(phone: string, message: string): Promise<void> {
//   const { apiUrl, apiKey, senderId } = getSmsConfig();

//   const normalizedPhone = normalizePhone(phone);
//   const encodedMessage = encodeURIComponent(message);

//   const requestUrl =
//     `${apiUrl}` +
//     `?api_key=${apiKey}` +
//     `&type=text` +
//     `&phone=${normalizedPhone}` +
//     `&senderid=${senderId}` +
//     `&message=${encodedMessage}`;

//   logger.info(`[SMS] Sending to ${normalizedPhone}...`);

//   const response = await axios.get(requestUrl, {
//     timeout: 10_000, // 10 seconds
//   });

//   logger.info(`[SMS] Gateway response:`, {
//     status: response.status,
//     data: response.data,
//   });
// }

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

  logger.info(`[SMS] Request URL: ${requestUrl}`);
  logger.info(`[SMS] Sending to ${normalizedPhone}...`);

  try {
    const response = await axios.get<{ status_code: number }>(requestUrl, {
      timeout: 8_000,
    });

    // Fix: stringify response.data properly
    logger.info(`[SMS] Gateway HTTP status: ${response.status}`);
    logger.info(
      `[SMS] Gateway response body: ${JSON.stringify(response.data)}`,
    );

    // Gateway returns { status_code: 200 } on success
    if (!response.data || response.data?.status_code !== 200) {
      throw new Error(
        `SMS gateway error. Response: ${JSON.stringify(response.data)}`,
      );
    }

    logger.info(`[SMS] SMS successfully queued for ${normalizedPhone}.`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        `[SMS] Axios error: ${error.message} | ` +
          `code: ${error.code} | ` +
          `status: ${error.response?.status} | ` +
          `data: ${JSON.stringify(error.response?.data)}`,
      );
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// OTP Core (private)
// ---------------------------------------------------------------------------

/**
 * Generates, hashes, persists, and delivers an OTP to the given phone number.
 *
 * Flow:
 *  1. Enforce resend cooldown — reject if an OTP was recently requested
 *  2. Invalidate all previously active (unexpired) OTPs for this phone
 *  3. Generate a cryptographically secure OTP and hash it with bcrypt
 *  4. Persist the hashed OTP record linked to the user via phone relation
 *  5. Deliver the plaintext OTP via SMS (skipped outside production)
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
  if (process.env.NODE_ENV === "production") {
    const message = buildOtpMessage(otp);
    await sendSms(phone, message);
    logger.info(`[OTP] SMS delivered to ${phone}.`);
  } else {
    // Log raw OTP to console in non-production for easy testing
    logger.info(`[OTP] DEV MODE — OTP for ${phone}: ${otp}`);
  }

  return {
    expiresAt,
    // Expose raw OTP only outside production
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
    throw new Error("OTP not found or has expired. Please request a new OTP.");
  }

  // ── 3. Compare submitted OTP against bcrypt hash ───────────────────────
  const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);

  // ── 4. On mismatch — throw descriptive error ───────────────────────────
  if (!isMatch) {
    logger.warn(`[OTP] Invalid OTP attempt for ${phone}.`);
    throw new Error("Invalid OTP. Please check the code and try again.");
  }

  // ── 5. Delete record — enforce single-use ─────────────────────────────
  await prisma.otp.delete({
    where: { otpId: otpRecord.otpId },
  });

  logger.info(`[OTP] Verified successfully for ${phone}.`);

  return true;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Register a new customer with phone number.
 *
 * Flow:
 *  1. Check phone number uniqueness
 *  2. Hash the password if provided
 *  3. Create the user and nested customer record
 *  4. Send a verification OTP to the phone number
 *
 * @param data - Validated registration DTO
 * @returns OTP expiry time (and raw OTP outside production)
 * @throws Error if phone is already registered or OTP sending fails
 */
export async function registerCustomer(
  data: CustomerRegisterDto,
): Promise<{ expiresAt: Date; otp?: string }> {
  try {
    // ── 1. Check phone uniqueness ─────────────────────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new Error("Phone number is already registered.");
    }

    // ── 2. Hash password if provided ──────────────────────────────────────
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, PASSWORD_SALT_ROUNDS)
      : null;

    // ── 3. Create user and customer records ───────────────────────────────
    await prisma.user.create({
      data: {
        phone: data.phone,
        name: data.name,
        address: data.address ?? [],
        passwordHash,
        role: "CUSTOMER",
        status: "PENDING",
        customer: { create: {} },
      },
    });

    logger.info(`[Customer] Registered new customer: ${data.phone}`);

    // ── 4. Send verification OTP ──────────────────────────────────────────
    const { expiresAt, otp } = await processAndSendOtp(data.phone);

    return { expiresAt, otp };
  } catch (error) {
    throw new Error(`Failed to register customer: ${getErrorMessage(error)}`);
  }
}

// ---------------------------------------------------------------------------
// Password Login
// ---------------------------------------------------------------------------

/**
 * Authenticate a customer with email/phone and password.
 *
 * Flow:
 *  1. Resolve user by email or phone
 *  2. Validate role and password availability
 *  3. Compare submitted password against stored bcrypt hash
 *  4. Issue and return JWT token with sanitized user data
 *
 * @param data - Validated login DTO (email or phone + password)
 * @returns JWT token and sanitized user object
 * @throws Error if credentials are invalid or account is not found
 */
export async function loginCustomer(
  data: CustomerLoginDto,
): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
  // ── 1. Resolve user by email or phone ─────────────────────────────────
  const identifier = data.email
    ? { email: data.email }
    : { phone: data.phone! };

  const user = await prisma.user.findUnique({
    where: identifier,
  });

  // ── 2. Validate role and password availability ─────────────────────────
  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Customer not found.");
  }

  if (!user.passwordHash) {
    throw new Error(
      "Password login is not enabled for this account. Please use OTP login.",
    );
  }

  // ── 3. Compare password ────────────────────────────────────────────────
  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid password. Please try again.");
  }

  logger.info(`[Customer] Password login successful: ${user.phone}`);

  // ── 4. Issue JWT ───────────────────────────────────────────────────────
  return generateAuthToken(user);
}

// ---------------------------------------------------------------------------
// OTP Login
// ---------------------------------------------------------------------------

/**
 * Initiate OTP-based login for a customer.
 *
 * Flow:
 *  1. Upsert user — create if not registered, skip update if already exists
 *  2. Send OTP via SMS and return expiry details
 *
 * @param data - Validated OTP login DTO (phone only)
 * @returns OTP expiry time (and raw OTP outside production)
 * @throws Error if OTP sending fails or cooldown is active
 */
export async function otpLoginCustomer(
  data: CustomerOtpLoginDto,
): Promise<{ expiresAt: Date; otp?: string }> {
  // ── 1. Upsert user ────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { phone: data.phone },
    update: {},
    create: {
      phone: data.phone,
      role: "CUSTOMER",
      status: "PENDING",
      customer: { create: {} },
    },
  });

  logger.info(`[Customer] OTP login initiated for ${data.phone}`);

  // ── 2. Send OTP ───────────────────────────────────────────────────────
  const { expiresAt, otp } = await processAndSendOtp(data.phone);

  return { expiresAt, otp };
}

// ---------------------------------------------------------------------------
// OTP Verification
// ---------------------------------------------------------------------------

/**
 * Verify customer OTP and complete the authentication flow.
 *
 * Flow:
 *  1. Verify the submitted OTP against the stored bcrypt hash
 *  2. Fetch the user with customer and wallet relations
 *  3. Create a wallet for the customer if one does not exist yet
 *  4. Activate the user account (status → ACTIVE)
 *  5. Issue and return JWT token with sanitized user data
 *
 * @param data - Validated OTP verification DTO (phone + otp)
 * @returns JWT token and sanitized user object
 * @throws Error if OTP is invalid, expired, or user is not found
 */
export async function verifyCustomerOtp(
  data: CustomerVerifyOtpDto,
): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
  // ── 1. Verify OTP ─────────────────────────────────────────────────────
  // validateOtp throws descriptive errors on failure
  await validateOtp(data.phone, data.otp);

  // ── 2. Fetch user with relations ──────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { phone: data.phone },
    include: {
      customer: {
        include: { wallet: true },
      },
    },
  });

  if (!user || user.role !== "CUSTOMER") {
    throw new Error("Customer not found.");
  }

  // ── 3. Create wallet if not yet set up ────────────────────────────────
  if (user.customer && !user.customer.wallet) {
    await prisma.wallet.create({
      data: { customerId: user.customer.customerId },
    });
    logger.info(`[Customer] Wallet created for customer: ${data.phone}`);
  }

  // ── 4. Activate user account ──────────────────────────────────────────
  const updatedUser = await prisma.user.update({
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

  logger.info(`[Customer] Account activated: ${data.phone}`);

  // ── 5. Issue JWT ──────────────────────────────────────────────────────
  return generateAuthToken(updatedUser);
}

// ---------------------------------------------------------------------------
// Profile Management
// ---------------------------------------------------------------------------

/**
 * Update customer profile fields by user ID.
 *
 * Flow:
 *  1. Build update payload from provided fields only
 *  2. Hash password if a new one is provided
 *  3. Reject if no valid fields were provided
 *  4. Persist updates and return the updated user record
 *
 * @param userId - Target customer's user ID (BigInt)
 * @param data   - Validated profile update DTO
 * @returns Updated user record (caller should strip passwordHash before response)
 * @throws Error if no valid fields are provided or user is not found
 */
export async function updateCustomerProfile(
  userId: bigint,
  data: CustomerUpdateProfileDto,
): Promise<User> {
  // ── 1. Build update payload ───────────────────────────────────────────
  const updateData: {
    name?: string;
    email?: string;
    address?: string[];
    passwordHash?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.email) updateData.email = data.email;
  if (data.address) updateData.address = data.address;

  // ── 2. Hash new password if provided ──────────────────────────────────
  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(
      data.password,
      PASSWORD_SALT_ROUNDS,
    );
  }

  // ── 3. Reject if no meaningful fields were provided ───────────────────
  const hasUpdates = Object.keys(updateData).some(
    (key) =>
      key !== "updatedAt" &&
      updateData[key as keyof typeof updateData] !== undefined,
  );

  if (!hasUpdates) {
    throw new Error("No valid fields provided for update.");
  }

  logger.info(`[Customer] Updating profile for userId: ${userId}`);

  // ── 4. Persist and return updated user ────────────────────────────────
  return prisma.user.update({
    where: { userId },
    data: updateData,
  });
}

/**
 * Retrieve a customer by user ID.
 * Validates that the found user is a CUSTOMER role.
 * Returns the user record without the passwordHash field.
 *
 * @param userId - Target customer's user ID (BigInt)
 * @returns Sanitized user object without passwordHash
 * @throws Error if user is not found or is not a CUSTOMER
 */
export async function getCustomerById(
  userId: bigint,
): Promise<Omit<User, "passwordHash">> {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: { customer: true },
  });

  if (!user) {
    throw new Error("Customer not found.");
  }

  if (user.role !== "CUSTOMER") {
    throw new Error("User is not a customer.");
  }

  const { passwordHash, ...customerData } = user;
  return customerData;
}
