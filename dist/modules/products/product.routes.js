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
/**
 * Routes for Product entity operations.
 * Defines API endpoints for product-related CRUD operations.
 */
const express_1 = require("express");
const validator_1 = __importDefault(require("@/middlewares/validator"));
const client_1 = require("@/generated/prisma/client");
const auth_1 = require("@/middlewares/auth");
const product_dto_1 = require("@/modules/products/product.dto");
const ProductController = __importStar(require("@/modules/products/product.controller"));
const configMulterUpload_1 = require("@/utils/fileUpload/configMulterUpload");
const router = (0, express_1.Router)();
// Route to create a new product
router.post("/", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), configMulterUpload_1.upload.array("images", 10), (0, validator_1.default)(product_dto_1.zCreateProductDto), ProductController.createProduct);
// Route to get all products
router.get("/", (0, validator_1.default)(product_dto_1.zGetAllProductsDto), ProductController.getAllProducts);
// Route to get a product by ID
router.get("/:id", (0, validator_1.default)(product_dto_1.zGetProductDto), ProductController.getProductById);
// Route to update a product's details
router.put("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), configMulterUpload_1.upload.array("images", 10), (0, validator_1.default)(product_dto_1.zUpdateProductDto), ProductController.updateProduct);
// Route to delete a product
router.delete("/:id", auth_1.authMiddleware, (0, auth_1.authorizeRoles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN), (0, validator_1.default)(product_dto_1.zDeleteProductDto), ProductController.deleteProduct);
exports.default = router;
