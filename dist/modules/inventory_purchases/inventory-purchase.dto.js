"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateInventoryPurchaseDto = exports.zCreateInventoryPurchaseDto = void 0;
// src/modules/inventory_purchases/inventory-purchase.dto.ts
/**
 * Data Transfer Objects (DTOs) for the InventoryPurchase entity
 * These interfaces define the expected shape of data when creating or updating an inventory purchase.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
// Assuming InventoryPurchaseStatus enum values (adjust based on your Prisma schema)
const inventoryPurchaseStatusEnum = zod_1.z.enum([
    "PENDING",
    "COMPLETED",
    "CANCELLED",
]);
/**
 * Zod schema for creating a new inventory purchase.
 * Validates all required fields necessary for creation.
 */
exports.zCreateInventoryPurchaseDto = zod_1.z.object({
    quantity: zod_1.z.number().int().positive("Quantity must be a positive integer"),
    unitCost: zod_1.z.number().positive("Unit cost must be positive"),
    totalCost: zod_1.z.number().positive("Total cost must be positive"),
    purchaseDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    status: inventoryPurchaseStatusEnum.optional(),
    notes: zod_1.z.string().optional(),
    farmerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Farmer ID must be a positive integer",
    }),
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    }),
});
/**
 * Zod schema for updating an inventory purchase.
 * All fields are optional to support partial updates.
 */
exports.zUpdateInventoryPurchaseDto = zod_1.z.object({
    quantity: zod_1.z
        .number()
        .int()
        .positive("Quantity must be a positive integer")
        .optional(),
    unitCost: zod_1.z.number().positive("Unit cost must be positive").optional(),
    totalCost: zod_1.z.number().positive("Total cost must be positive").optional(),
    purchaseDate: zod_1.z
        .string()
        .datetime()
        .optional()
        .transform((val) => (val ? new Date(val) : undefined)),
    status: inventoryPurchaseStatusEnum.optional(),
    notes: zod_1.z.string().optional(),
    farmerId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Farmer ID must be a positive integer",
    })
        .optional(),
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    })
        .optional(),
});
