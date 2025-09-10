/**
 * Service layer for Admin authentication operations.
 * Handles admin creation by super admins and login.
 */
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { AppError } from "@/utils/appError";
import prisma from "@/prisma-client/prismaClient";
import { generateAuthToken } from "@/utils/authToken";
import { getErrorMessage } from "@/utils/errorHandler";
import { sendOtp, verifyOtp } from "@/utils/otpService";
import { User, UserRole } from "@/generated/prisma/client";
import {
  AdminForgotPasswordDto,
  AdminLoginDto,
  AdminResetPasswordDto,
  CreateAdminDto,
} from "@/modules/auth/admin/admin.dto";

const SALT_ROUNDS = 10;

/**
 * Create admin by super admin only
 */
export async function createAdmin(
  data: CreateAdminDto
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
          ? "Email already registered"
          : "Phone number already registered"
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

/**
 * login admin/superAdmin through email/phone with password.
 */
export async function loginAdmin(
  data: AdminLoginDto
): Promise<{ token: string; user: Omit<User, "passwordHash"> }> {
  try {
    // Validate input
    if (!data.password) throw new Error("Password is required");
    if (!data.email && !data.phone) {
      throw new Error("Email or phone is required");
    }

    // Determine identifier
    const identifier = data.email
      ? { email: data.email }
      : { phone: data.phone! };

    // Find user
    const user = await prisma.user.findUnique({
      where: identifier,
      include: { admin: true },
    });

    // Validate user
    if (!user) throw new Error("Invalid credentials");
    if (!user.passwordHash) throw new Error("Password not set yet");
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new Error("Invalid credentials");
    }
    const { passwordHash: _, ...userData } = user;
    // Verify password
    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) throw new Error("Invalid credentials");

    // Generate token
    return generateAuthToken(userData);
  } catch (error) {
    throw new Error(`Failed to login admin: ${getErrorMessage(error)}`);
  }
}

/**
 *
 */
export const adminForgotPassword = async (
  phone: AdminForgotPasswordDto["body"]["phone"]
) => {
  // check user exits or not
  const user = await prisma.user.findUnique({
    where: { phone: phone },
    select: { userId: true },
  });
  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }
  // send otp via sms
  const res = await sendOtp(phone);
  return res.otp; // TODO: Need to remove this line when in production
};

/**
 * Resets an admin's password using a valid OTP sent to their phone.
 * @throws {AppError} If the OTP is invalid or has expired
 * @throws {AppError} If the user is not found
 */
export const adminResetPassword = async (
  bodyData: AdminResetPasswordDto["body"]
) => {
  const { otp, phone, password } = bodyData;
  const now = new Date();
  // Check OTP exits or not
  const otpRecord = await prisma.otp.findFirst({
    where: { phone, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError("Your OTP is not valid", httpStatus.UNAUTHORIZED);
  }
  // Check is OTP valid or not
  const isValidOtp = await verifyOtp(phone, otp);
  if (!isValidOtp) {
    throw new AppError("Your OTP is not valid", httpStatus.UNAUTHORIZED);
  }

  // Check user exits or not
  const user = await prisma.user.findUnique({
    where: { phone: phone },
    select: { userId: true, role: true },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }
  // Check user role is ADMIN | SUPER_ADMIN | SUPPORT
  const validRoles: UserRole[] = [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.SUPPORT,
  ];
  if (!validRoles.includes(user.role)) {
    throw new AppError("You are not permitted", httpStatus.UNAUTHORIZED);
  }
  // Update password
  const SALT_ROUNDS = 10;
  await prisma.otp.deleteMany({
    where: { phone: phone },
  });
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await prisma.user.update({
    where: { phone: phone },
    data: { passwordHash },
  });
  // Delete all OTP records for the user
  await prisma.otp.deleteMany({
    where: { phone: phone },
  });
};
/**
 * Delete an admin by ID
 * @param adminId The ID of the admin to delete
 * @param requestingUserId The ID of the superAdmin making the request
 * @throws Error if admin not found or if trying to delete self
 */
export const deleteAdmin = async (
  adminId: bigint,
  requestingUserId?: string
): Promise<User> => {
  try {
    // Prevent self-deletion
    if (requestingUserId && BigInt(requestingUserId) === adminId) {
      throw new Error("SuperAdmin cannot delete themselves");
    }

    return await prisma.$transaction(async (prisma) => {
      // Verify admin exists and is not a superAdmin
      const adminToDelete = await prisma.user.findUnique({
        where: { userId: Number(adminId) },
        include: { admin: true },
      });

      if (!adminToDelete) {
        throw new Error("Admin not found");
      }

      if (adminToDelete.role === "SUPER_ADMIN") {
        throw new Error("Cannot delete a superAdmin");
      }

      // Delete the admin record first if it exists
      if (adminToDelete.admin) {
        await prisma.admin.delete({
          where: { userId: Number(adminId) },
        });
      }

      // Then delete the user
      return await prisma.user.delete({
        where: { userId: Number(adminId) },
      });
    });
  } catch (error) {
    throw new Error(`Error deleting admin: ${getErrorMessage(error)}`);
  }
};
