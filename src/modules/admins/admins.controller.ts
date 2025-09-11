import httpStatus from "http-status";
import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import { Admin } from "@/generated/prisma/client";
import * as adminService from "@/modules/admins/admins.service";

// Route to get all admins list
export const getAllAdmins = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const admins = await adminService.getAllAdmins();

    sendResponse<Admin[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admins retrieved successfully",
      data: admins,
    });
  }
);
// Route to get an admin by ID
export const getAdminById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(req.params.id);
    const admin = await adminService.getAdminById(id);

    sendResponse<Admin>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin retrieved successfully",
      data: admin,
    });
  }
);

// Route to delete an admin by ID
export const deleteAdmin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = BigInt(req.params.id);
    await adminService.deleteAdmin(id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin deleted successfully",
    });
  }
);
