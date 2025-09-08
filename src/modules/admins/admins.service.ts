//src/modules/admins/admins.service.ts
import bcrypt from "bcrypt";
import { Admin } from "@/generated/prisma/client";
import prisma from "@/prisma-client/prismaClient";
import { getErrorMessage } from "@/utils/errorHandler";
import { UpdateAdminDto } from "@/modules/admins/admins.dto";

export const getAllAdmins = async (): Promise<Admin[]> => {
  return prisma.admin.findMany();
};

export const getAdminById = async (adminId: bigint): Promise<Admin | null> => {
  try {
    return await prisma.admin.findUnique({
      where: { adminId: Number(adminId) }, // Convert BigInt to Number for Prisma compatibility
    });
  } catch (error) {
    throw new Error(`Error fetching farmer by ID: ${getErrorMessage(error)}`);
  }
};

export const updateAdmin = async (
  adminId: bigint,
  data: UpdateAdminDto
): Promise<Admin> => {
  const updateData: any = { ...data };

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

export const deleteAdmin = async (farmerId: BigInt): Promise<Admin> => {
  try {
    return await prisma.admin.delete({
      where: { adminId: Number(farmerId) }, // Convert BigInt to Number for Prisma compatibility
    });
  } catch (error) {
    throw new Error(`Error deleting farmer: ${getErrorMessage(error)}`);
  }
};
