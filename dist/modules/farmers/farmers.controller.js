"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFarmer = exports.updateFarmer = exports.getFarmerById = exports.getAllFarmers = exports.createFarmer = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const farmerService = __importStar(require("../../modules/farmers/farmers.service"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
/**
 * Create a new farmer
 */
exports.createFarmer = (0, asyncHandler_1.default)(async (req, res) => {
    const data = req.body;
    const farmer = await farmerService.createFarmer(data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Farmer created successfully",
        data: farmer,
    });
});
/**
 * Get all farmers
 */
exports.getAllFarmers = (0, asyncHandler_1.default)(async (req, res) => {
    const { page, limit, sort, search } = req.query;
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { search };
    const result = await farmerService.getAllFarmers(paginationParams, filterParams);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
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
});
/**
 * Get a single farmer by ID
 */
exports.getFarmerById = (0, asyncHandler_1.default)(async (req, res) => {
    const farmerId = BigInt(req.params.id);
    const farmer = await farmerService.getFarmerById(farmerId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Farmer retrieved successfully",
        data: farmer,
    });
});
/**
 * Update a farmer by ID
 */
exports.updateFarmer = (0, asyncHandler_1.default)(async (req, res) => {
    const farmerId = BigInt(req.params.id);
    const data = req.body;
    const updatedFarmer = await farmerService.updateFarmer(farmerId, data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Farmer updated successfully",
        data: updatedFarmer,
    });
});
/**
 * Delete a farmer by ID
 */
exports.deleteFarmer = (0, asyncHandler_1.default)(async (req, res) => {
    const farmerId = BigInt(req.params.id);
    await farmerService.deleteFarmer(farmerId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Farmer deleted successfully",
    });
});
