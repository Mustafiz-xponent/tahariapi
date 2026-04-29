"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteProductDto = exports.zUpdateProductDto = exports.zGetProductDto = exports.zGetAllProductsDto = exports.zCreateProductDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Product entity
 * Updated to handle image uploads with product operations
 */
const zod_1 = require("zod");
const client_1 = require("../../generated/prisma/client");
const zBigIntId = (fieldName) => zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
/**
 * Zod schema for creating a new product.
 * Validates all required fields necessary for creation.
 * Images are handled separately through file upload.
 */
exports.zCreateProductDto = {
    body: zod_1.z
        .object({
        name: zod_1.z.string().min(1, "Name is required"),
        description: zod_1.z.string().optional(),
        unitPrice: zod_1.z.coerce.number().positive("Unit price must be positive"),
        unitType: zod_1.z.nativeEnum(client_1.ProductUnitType),
        packageSize: zod_1.z.coerce.number().positive("Package size must be positive"),
        stockQuantity: zod_1.z.coerce
            .number()
            .int()
            .nonnegative("Stock quantity must be a non-negative integer")
            .optional(),
        reorderLevel: zod_1.z.coerce
            .number()
            .int()
            .nonnegative("Reorder level must be a non-negative integer")
            .optional(),
        isSubscription: zod_1.z
            .union([zod_1.z.boolean(), zod_1.z.string()])
            .transform((val) => typeof val === "string" ? val.toLowerCase() === "true" : val)
            .optional(),
        isPreorder: zod_1.z
            .union([zod_1.z.boolean(), zod_1.z.string()])
            .transform((val) => typeof val === "string" ? val.toLowerCase() === "true" : val)
            .optional(),
        preorderAvailabilityDate: zod_1.z
            .string()
            .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        })
            .transform((val) => (val ? new Date(val) : undefined))
            .optional(),
        categoryId: zBigIntId("Category ID"),
        farmerId: zBigIntId("Farmer ID"),
    })
        .refine((data) => {
        // If preorder is enabled, subscription must be false and date must be provided
        if (data.isPreorder) {
            return (data.isSubscription === false &&
                data.preorderAvailabilityDate !== undefined);
        }
        return true;
    }, {
        message: "When preorder is enabled, subscription must be disabled and preorder availability date is required",
        path: ["isPreorder"],
    })
        .refine((data) => {
        // If subscription is enabled, preorder must be false
        if (data.isSubscription) {
            return data.isPreorder === false;
        }
        return true;
    }, {
        message: "When subscription is enabled, preorder must be disabled",
        path: ["isSubscription"],
    })
        .refine((data) => {
        // Both cannot be true at the same time
        return !(data.isSubscription && data.isPreorder);
    }, {
        message: "Product cannot be both subscription and preorder at the same time",
        path: ["isSubscription"],
    }),
};
/*
 ** Schema: Get All Products (Query Parameters)
 ** Includes pagination, sorting, filtering
 */
exports.zGetAllProductsDto = {
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().optional().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
        sort: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        isSubscription: zod_1.z
            .union([zod_1.z.literal("true"), zod_1.z.literal("false")])
            .optional()
            .transform((val) => val === "true"),
        isPreorder: zod_1.z
            .union([zod_1.z.literal("true"), zod_1.z.literal("false")])
            .optional()
            .transform((val) => val === "true"),
        name: zod_1.z.string().optional(),
        status: zod_1.z.enum(["in-stock", "out-of-stock", "low-stock"]).optional(),
        categoryIds: zod_1.z
            .string()
            .optional()
            .transform((val) => val
            ? val
                .split(",")
                .map((id) => zBigIntId("Category Id").parse(id.trim()))
            : []),
        farmerIds: zod_1.z
            .string()
            .optional()
            .transform((val) => val
            ? val.split(",").map((id) => zBigIntId("Farmer Id").parse(id.trim()))
            : []),
    }),
};
/*
 ** Schema: Get single product by Id
 */
exports.zGetProductDto = {
    params: zod_1.z.object({
        id: zBigIntId("Product Id"),
    }),
};
/**
 * Zod schema for updating a product.
 * All fields are optional to support partial updates.
 * Images are handled separately through file upload.
 */
exports.zUpdateProductDto = {
    params: zod_1.z.object({
        id: zBigIntId("Product ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").optional(),
        description: zod_1.z.string().optional(),
        unitPrice: zod_1.z.coerce
            .number()
            .positive("Unit price must be positive")
            .optional(),
        unitType: zod_1.z.nativeEnum(client_1.ProductUnitType).optional(),
        packageSize: zod_1.z.coerce
            .number()
            .positive("Package size must be positive")
            .optional(),
        stockQuantity: zod_1.z.coerce
            .number()
            .int()
            .nonnegative("Stock quantity must be a non-negative integer")
            .optional(),
        reorderLevel: zod_1.z.coerce
            .number()
            .int()
            .nonnegative("Reorder level must be a non-negative integer")
            .optional(),
        preorderAvailabilityDate: zod_1.z
            .string()
            .datetime()
            .optional()
            .transform((val) => (val ? new Date(val) : undefined)),
        categoryId: zBigIntId("Category ID").optional(),
        farmerId: zBigIntId("Farmer Id").optional(),
        deletedImages: zod_1.z.string().array().optional(),
    }),
};
/*
 ** Schema: Delete single product by Id
 */
exports.zDeleteProductDto = {
    params: zod_1.z.object({
        id: zBigIntId("Product Id"),
    }),
};
