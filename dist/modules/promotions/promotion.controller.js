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
exports.deletePromotion = exports.updatePromotion = exports.getPromotionById = exports.getAllPromotions = exports.createPromotion = void 0;
const http_status_1 = __importDefault(require("http-status"));
const asyncHandler_1 = __importDefault(require("@/utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const promotionService = __importStar(require("@/modules/promotions/promotion.service"));
/**
 * Create a new promotion
 * - Expects promotion data in `req.body`
 * - Expects `req.file` to accepts a file (e.g., image/banner)
 * - Calls service to create promotion and returns response
 */
exports.createPromotion = (0, asyncHandler_1.default)(async (req, res) => {
    const data = req.body;
    const file = req.file;
    const promotion = await promotionService.createPromotion(data, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        message: "Promotion created successfully",
        data: promotion,
        statusCode: http_status_1.default.CREATED,
    });
});
/**
 * Get all promotions with pagination and filtering
 * - Accepts query params: page, limit, sort, placement, targetType
 * - Calls service to fetch paginated + filtered promotions
 */
exports.getAllPromotions = (0, asyncHandler_1.default)(async (req, res) => {
    const { page, limit, sort, placement, targetType, search, status } = req.query;
    const skip = (page - 1) * limit;
    const paginationParams = { page, limit, skip, sort };
    const filterParams = { placement, targetType, search, status };
    const result = await promotionService.getAllPromotions(paginationParams, filterParams);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Promotions retrieved successfully",
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
 * Get a single promotion by its ID
 * - Converts the string ID from URL param into BigInt
 * - Calls service to get promotion by ID
 */
exports.getPromotionById = (0, asyncHandler_1.default)(async (req, res) => {
    const promotionId = BigInt(req.params.id);
    const promotion = await promotionService.getPromotionById(promotionId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Promotion retrieved successfully",
        data: promotion,
    });
});
/**
 * Update a promotion by ID
 * - Accepts updated data in body and optional file
 * - Converts the ID to BigInt
 * - Calls service to update promotion
 */
exports.updatePromotion = (0, asyncHandler_1.default)(async (req, res) => {
    const promotionId = BigInt(req.params.id);
    const data = req.body;
    const file = req.file;
    const promotion = await promotionService.updatePromotion(promotionId, data, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Promotion updated successfully",
        data: promotion,
    });
});
/**
 * Delete a promotion by ID
 * - Converts ID to BigInt
 * - Calls service to delete promotion
 */
exports.deletePromotion = (0, asyncHandler_1.default)(async (req, res) => {
    const promotionId = BigInt(req.params.id);
    await promotionService.deletePromotion(promotionId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Promotion deleted successfully",
    });
});
