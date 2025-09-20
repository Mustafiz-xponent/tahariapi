import httpStatus from "http-status";
import { Request, Response } from "express";
import sendResponse from "@/utils/sendResponse";
import { Farmer } from "@/generated/prisma/client";
import * as farmerService from "@/modules/farmers/farmers.service";
import { CreateFarmerDto, GetAllFarmerDto } from "@/modules/farmers/farmer.dto";
import asyncHandler from "@/utils/asyncHandler";

/**
 * Create a new farmer
 */
export const createFarmer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const data = req.body as CreateFarmerDto["body"];
    const farmer = await farmerService.createFarmer(data);
    sendResponse<Farmer>(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Farmer created successfully",
      data: farmer,
    });
  }
);

/**
 * Get all farmers
 */
export const getAllFarmers = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, sort, search } =
      req.query as unknown as GetAllFarmerDto["query"];
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { search };

    const result = await farmerService.getAllFarmers(
      paginationParams,
      filterParams
    );

    sendResponse<Farmer[]>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmers retrieved successfully",
      data: result.data,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.totalCount,
        itemsPerPage: limit,
        hasNextPage: page < result.totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }
);

/**
 * Get a single farmer by ID
 */
export const getFarmerById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const farmerId = BigInt(req.params.id);
    const farmer = await farmerService.getFarmerById(farmerId);

    sendResponse<Farmer>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer retrieved successfully",
      data: farmer,
    });
  }
);

/**
 * Update a farmer by ID
 */
export const updateFarmer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const farmerId = BigInt(req.params.id);
    const data = req.body;
    const updatedFarmer = await farmerService.updateFarmer(farmerId, data);
    
    sendResponse<Farmer>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer updated successfully",
      data: updatedFarmer,
    });
  }
);

/**
 * Delete a farmer by ID
 */
export const deleteFarmer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const farmerId = BigInt(req.params.id);
    await farmerService.deleteFarmer(farmerId);
    sendResponse<null>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Farmer deleted successfully",
      data: null,
    });
  }
);
