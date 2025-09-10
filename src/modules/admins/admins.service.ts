import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { AppError } from "@/utils/appError";
import { Admin } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { UpdateAdminDto } from "@/modules/admins/admins.dto";

/**
 * Retrieves all admins from the database.
 * @returns A list of Admin objects
 */
export const getAllAdmins = async (): Promise<Admin[]> => {
  const admins = await prisma.admin.findMany();
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
  });
  if (!admin) throw new AppError("Admin not found", httpStatus.NOT_FOUND);
  return admin;
};

/**
 * Updates an existing admin in the database.
 * @param adminId The ID of the admin to update
 * @param data The data to update the admin with
 * @returns The updated Admin object
 * @throws AppError if the admin does not exist
 */
export const updateAdmin = async (
  adminId: bigint,
  data: UpdateAdminDto
): Promise<Admin> => {
  const updateData: any = { ...data };
  // check admin exits or not
  const admin = await prisma.admin.findUnique({
    where: { adminId },
  });
  if (!admin) throw new AppError("Admin not found", httpStatus.NOT_FOUND);

  if (data.password) {
    const saltRounds = 10;
    updateData.passwordHash = await bcrypt.hash(data.password, saltRounds);
    delete updateData.password;
  }

  return prisma.admin.update({
    where: { adminId },
    data: updateData,
  });
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
