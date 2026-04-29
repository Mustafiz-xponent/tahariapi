"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFarmer = exports.updateFarmer = exports.getFarmerById = exports.getAllFarmers = exports.createFarmer = void 0;
const http_status_1 = __importDefault(require("http-status"));
const appError_1 = require("../../utils/appError");
const prismaClient_1 = __importDefault(require("../../prisma-client/prismaClient"));
// Create a new farmer
const createFarmer = async (data) => {
    const farmer = await prismaClient_1.default.farmer.create({ data });
    return farmer;
};
exports.createFarmer = createFarmer;
// Get all farmers
const getAllFarmers = async (paginationParams, filterParams) => {
    const { page, limit, skip, sort } = paginationParams;
    const { search } = filterParams;
    const where = {};
    if (search && search.trim() !== "") {
        where.farmName = {
            contains: search,
            mode: "insensitive",
        };
    }
    // Get all farmers
    const farmers = await prismaClient_1.default.farmer.findMany({
        where,
        include: { products: { select: { name: true } } },
        take: limit,
        skip: skip,
        orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
    });
    // Count total farmers
    const totalFarmers = await prismaClient_1.default.farmer.count({ where });
    return {
        data: farmers,
        currentPage: page,
        totalPages: Math.ceil(totalFarmers / limit),
        totalCount: totalFarmers,
    };
};
exports.getAllFarmers = getAllFarmers;
// Get a farmer by ID
const getFarmerById = async (farmerId) => {
    const farmer = await prismaClient_1.default.farmer.findUnique({
        where: { farmerId },
        include: { products: { select: { name: true } } },
    });
    if (!farmer) {
        throw new appError_1.AppError("Farmer not found", http_status_1.default.BAD_REQUEST);
    }
    return farmer;
};
exports.getFarmerById = getFarmerById;
// Update a farmer's details
const updateFarmer = async (farmerId, data) => {
    const farmer = await prismaClient_1.default.farmer.findUnique({ where: { farmerId } });
    if (!farmer) {
        throw new appError_1.AppError("Farmer not found", http_status_1.default.BAD_REQUEST);
    }
    const updatedFarmer = await prismaClient_1.default.farmer.update({
        where: { farmerId },
        data,
    });
    return updatedFarmer;
};
exports.updateFarmer = updateFarmer;
// Delete a farmer
const deleteFarmer = async (farmerId) => {
    const farmer = await prismaClient_1.default.farmer.findUnique({
        where: { farmerId },
        include: { products: { select: { productId: true } } },
    });
    if (!farmer) {
        throw new appError_1.AppError("Farmer not found", http_status_1.default.BAD_REQUEST);
    }
    await prismaClient_1.default.$transaction([
        prismaClient_1.default.product.deleteMany({
            where: { farmerId },
        }),
        prismaClient_1.default.farmer.delete({
            where: { farmerId },
        }),
    ]);
};
exports.deleteFarmer = deleteFarmer;
