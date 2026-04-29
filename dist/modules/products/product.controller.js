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
exports.deleteProduct = exports.updateProduct = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
/**
 * Controller layer for Product entity operations.
 * Updated to handle image uploads with product creation and updates.
 */
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("@/utils/sendResponse"));
const productService = __importStar(require("@/modules/products/product.service"));
const asyncHandler_1 = __importDefault(require("@/utils/asyncHandler"));
/**
 * Create a new product with optional image uploads
 */
exports.createProduct = (0, asyncHandler_1.default)(async (req, res) => {
    const data = req.body;
    const files = req.files;
    const product = await productService.createProduct(data, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Product created successfully",
        data: product,
    });
});
/**
 * Get all products with optional relations and pagination
 */
exports.getAllProducts = (0, asyncHandler_1.default)(async (req, res) => {
    const { page, limit, isSubscription, sort, isPreorder, name, categoryIds, farmerIds, status, } = req.query;
    const skip = (page - 1) * limit;
    const filters = {
        isSubscription,
        isPreorder,
        name,
        categoryIds,
        farmerIds,
        status,
    };
    const paginationParams = { page, limit, skip, sort };
    const result = await productService.getAllProducts(paginationParams, filters);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Products retrieved successfully",
        data: result.products,
        pagination: {
            currentPage: page,
            totalPages: result.totalPages,
            totalItems: result.totalCount,
            itemsPerPage: limit,
            hasNextPage: page < result.totalPages,
            hasPreviousPage: page > 1,
        },
    });
});
/**
 * Get a single product by ID with optional relations
 */
exports.getProductById = (0, asyncHandler_1.default)(async (req, res) => {
    const productId = BigInt(req.params.id);
    const product = await productService.getProductById(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product retrieved successfully",
        data: product,
    });
});
/**
 * Update a product by ID with optional image uploads
 */
exports.updateProduct = (0, asyncHandler_1.default)(async (req, res) => {
    const productId = BigInt(req.params.id);
    const data = req.body;
    const files = req.files;
    const updated = await productService.updateProduct(productId, data, files);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product updated successfully",
        data: updated,
    });
});
/**
 * Delete a product by ID (automatically handles image cleanup)
 */
exports.deleteProduct = (0, asyncHandler_1.default)(async (req, res) => {
    const productId = BigInt(req.params.id);
    await productService.deleteProduct(productId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Product deleted successfully",
    });
});
