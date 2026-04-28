"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteCategoryDto = exports.zUpdateCategoryDto = exports.zGetCategoryDto = exports.zGetCategoriesDto = exports.zCreateCategoryDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Category entity
 * These interfaces define the expected shape of data when creating or updating a category.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
const zBigIntId = (fieldName) => zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
/**
 * Zod schema for creating a new category.
 * Validates all required fields necessary for creation.
 */
exports.zCreateCategoryDto = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required"),
        description: zod_1.z.string().optional(),
    }),
};
/**
 * Zod schema for getting a categories.
 */
exports.zGetCategoriesDto = {
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().optional().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
        sort: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        search: zod_1.z.string().trim().optional(),
    }),
};
/**
 * Zod schema for getting a category by ID.
 */
exports.zGetCategoryDto = {
    params: zod_1.z.object({
        id: zBigIntId("Category ID"),
    }),
};
/**
 * Zod schema for updating a category.
 * All fields are optional to support partial updates.
 */
exports.zUpdateCategoryDto = {
    params: zod_1.z.object({
        id: zBigIntId("Category ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
    }),
};
/**
 * Zod schema for deleting a category.
 */
exports.zDeleteCategoryDto = {
    params: zod_1.z.object({
        id: zBigIntId("Category ID"),
    }),
};
