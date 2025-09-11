import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { AppError } from "@/utils/appError";
import { Admin } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";

/**
 * Retrieves all admins from the database.
 * @returns A list of Admin objects
 */
export const getAllAdmins = async (): Promise<Admin[]> => {
  const admins = await prisma.admin.findMany({
    include: { user: { omit: { passwordHash: true } } },
  });
  return admins;
};

/**
 * Retrieves an admin by ID from the database.
 * @param adminId The ID of the admin to retrieve
 * @returns The requested Admin object
 * @throws AppError if the admin does not exist
 */
export const getAdminById = async (adminId: bigint): Promise<Admin> => {
  const admin = await prisma.admin.findUnique({
    where: { adminId },
    include: { user: { omit: { passwordHash: true } } },
  });
  if (!admin) throw new AppError("Admin not found", httpStatus.NOT_FOUND);
  return admin;
};

/**
 * Deletes an existing admin from the database.
 * @param adminId The ID of the admin to delete
 * @throws AppError if the admin does not exist
 */
export const deleteAdmin = async (adminId: bigint): Promise<void> => {
  // check admin exits or not
  const admin = await prisma.admin.findUnique({
    where: { adminId },
  });
  if (!admin) throw new AppError("Admin not found", httpStatus.NOT_FOUND);
  // Delete the admin
  await prisma.admin.delete({
    where: { adminId },
  });
};
