import prisma from "@/prisma-client/prismaClient";
import { Farmer } from "@/generated/prisma/client";
import { getErrorMessage } from "@/utils/errorHandler";
import { CreateFarmerDto, UpdateFarmerDto } from "@/modules/farmers/farmer.dto";
import { GetAllFarmersResult } from "@/modules/farmers/farmers.interface";
import { AppError } from "@/utils/appError";
import httpStatus from "http-status";

// Create a new farmer
export const createFarmer = async (
  data: CreateFarmerDto["body"]
): Promise<Farmer> => {
  const farmer = await prisma.farmer.create({ data });
  return farmer;
};

// Get all farmers
export const getAllFarmers = async (
  paginationParams: {
    page: number;
    limit: number;
    skip: number;
    sort: string;
  },
  filterParams: { search?: string }
): Promise<GetAllFarmersResult> => {
  const { page, limit, skip, sort } = paginationParams;
  const { search } = filterParams;

  const where: any = {};
  if (search && search.trim() !== "") {
    where.farmName = {
      contains: search,
      mode: "insensitive",
    };
  }
  // Get all farmers
  const farmers = await prisma.farmer.findMany({
    where,
    include: { products: { select: { name: true } } },
    take: limit,
    skip: skip,
    orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
  });
  // Count total farmers
  const totalFarmers = await prisma.farmer.count({ where });

  return {
    data: farmers,
    currentPage: page,
    totalPages: Math.ceil(totalFarmers / limit),
    totalCount: totalFarmers,
  };
};

// Get a farmer by ID
export const getFarmerById = async (farmerId: bigint): Promise<Farmer> => {
  const farmer = await prisma.farmer.findUnique({
    where: { farmerId },
    include: { products: { select: { name: true } } },
  });
  if (!farmer) {
    throw new AppError("Farmer not found", httpStatus.BAD_REQUEST);
  }
  return farmer;
};

// Update a farmer's details
export const updateFarmer = async (
  farmerId: bigint,
  data: UpdateFarmerDto["body"]
): Promise<Farmer> => {
  const farmer = await prisma.farmer.findUnique({ where: { farmerId } });
  if (!farmer) {
    throw new AppError("Farmer not found", httpStatus.BAD_REQUEST);
  }
  const updatedFarmer = await prisma.farmer.update({
    where: { farmerId },
    data,
  });
  return updatedFarmer;
};

// Delete a farmer
export const deleteFarmer = async (farmerId: bigint): Promise<void> => {
  const farmer = await prisma.farmer.findUnique({ where: { farmerId } });

  if (!farmer) {
    throw new AppError("Farmer not found", httpStatus.BAD_REQUEST);
  }
  await prisma.farmer.delete({
    where: { farmerId },
  });
};
