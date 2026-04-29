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
exports.deleteCategory = exports.updateCategory = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
/**
 * Controller layer for category operations.
 * Handles HTTP requests and responses for category endpoints.
 */
const http_status_1 = __importDefault(require("http-status"));
const asyncHandler_1 = __importDefault(require("@/utils/asyncHandler"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const categoryService = __importStar(require("@/modules/categories/category.service"));
/**
 * Create a new category
 */
exports.createCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const data = req.body;
    const file = req.file;
    const category = await categoryService.createCategory({ data, file });
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Category created successfully",
        data: category,
    });
});
/**
 * Get all categories with accessible image URLs for products
 */
exports.getAllCategories = (0, asyncHandler_1.default)(async (req, res) => {
    const { page, limit, sort, search } = req.query;
    const skip = (page - 1) * limit;
    const queryOptions = { page, limit, skip, sort, search };
    const result = await categoryService.getAllCategories(queryOptions);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Categories retrieved successfully",
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
 * Get a single category by ID with accessible image URLs for products
 */
exports.getCategoryById = (0, asyncHandler_1.default)(async (req, res) => {
    const categoryId = BigInt(req.params.id);
    const category = await categoryService.getCategoryById(categoryId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Category retrieved successfully",
        data: category,
    });
});
/**
 * Update a category by ID
 */
exports.updateCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const categoryId = BigInt(req.params.id);
    const data = req.body;
    const file = req.file;
    const updated = await categoryService.updateCategory(categoryId, data, file);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Category updated successfully",
        data: updated,
    });
});
/**
 * Delete a category by ID
 */
exports.deleteCategory = (0, asyncHandler_1.default)(async (req, res) => {
    const categoryId = BigInt(req.params.id);
    await categoryService.deleteCategory(categoryId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Category deleted successfully",
    });
});
