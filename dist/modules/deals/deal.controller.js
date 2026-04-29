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
exports.deleteDeal = exports.updateDeal = exports.getDealById = exports.getAllDeals = exports.createDeal = void 0;
const http_status_1 = __importDefault(require("http-status"));
const asyncHandler_1 = __importDefault(require("../../utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const dealService = __importStar(require("../../modules/deals/deal.service"));
/**
 * Create a new deal
 * - Expects deal data in `req.body`
 * @description Calls service to create deal and returns response
 */
exports.createDeal = (0, asyncHandler_1.default)(async (req, res) => {
    const data = req.body;
    const deal = await dealService.createDeal(data);
    (0, sendResponse_1.default)(res, {
        success: true,
        message: "Deal created successfully",
        data: deal,
        statusCode: http_status_1.default.CREATED,
    });
});
/**
 * Get all deals with pagination and filtering
 * - Accepts query params: page, limit, sort
 * @description Calls service to fetch paginated + filtered promotions
 */
exports.getAllDeals = (0, asyncHandler_1.default)(async (req, res) => {
    const { page, limit, sort, isActive } = req.query;
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { isActive };
    const result = await dealService.getAllDeals(paginationParams, filterParams);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Deals retrieved successfully",
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
 * Get a single deal by its ID
 * - Converts the string ID from URL param into BigInt
 * @description Calls service to get promotion by ID
 */
exports.getDealById = (0, asyncHandler_1.default)(async (req, res) => {
    const dealId = BigInt(req.params.id);
    const deal = await dealService.getDealById(dealId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Deal retrieved successfully",
        data: deal,
    });
});
/**
 * Update a deal by ID
 * - Converts the ID to BigInt
 * @description Calls service to update deal and returns response
 */
exports.updateDeal = (0, asyncHandler_1.default)(async (req, res) => {
    const data = req.body;
    const dealId = BigInt(req.params.id);
    const promotion = await dealService.updateDeal(dealId, data);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Deal updated successfully",
        data: promotion,
    });
});
/**
 * Delete a delete by ID
 * - Converts ID to BigInt
 * @description Calls service to delete deal
 */
exports.deleteDeal = (0, asyncHandler_1.default)(async (req, res) => {
    const dealId = BigInt(req.params.id);
    await dealService.deleteDeal(dealId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Deal deleted successfully",
    });
});
