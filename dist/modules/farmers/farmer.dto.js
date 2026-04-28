"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteFarmerDto = exports.zUpdateFarmerDto = exports.zGetFarmerDto = exports.zGetAllFarmersDto = exports.zCreateFarmerDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Farmer entity
 * These interfaces define the expected shape of data when creating or updating a farmer.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
const bdPhoneValidator = zod_1.z
    .string()
    .regex(/^\+8801[3-9]\d{8}$/, "Must be a valid Bangladeshi phone number")
    .trim();
const zBigIntId = (fieldName) => zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
/**
 * Zod schema for creating a new farmer.
 * Validates all required fields necessary for creation.
 */
exports.zCreateFarmerDto = {
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required"),
        farmName: zod_1.z.string().min(1, "Farm name is required"),
        address: zod_1.z.string().min(1, "Address is required"),
        contactInfo: bdPhoneValidator.optional(),
    }),
};
/**
 * Zod schema for getting all farmers.
 */
exports.zGetAllFarmersDto = {
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().optional().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
        sort: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        search: zod_1.z.string().trim().optional(),
    }),
};
/**
 * Get single farmer by ID schema
 **/
exports.zGetFarmerDto = {
    params: zod_1.z.object({
        id: zBigIntId("Farmer ID"),
    }),
};
/**
 * Zod schema for updating a farmer.
 * All fields are optional to support partial updates.
 */
exports.zUpdateFarmerDto = {
    params: zod_1.z.object({
        id: zBigIntId("Farmer ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        farmName: zod_1.z.string().min(1).optional(),
        address: zod_1.z.string().min(1).optional(),
        contactInfo: bdPhoneValidator.optional(),
    }),
};
/**
 * Zod schema for deleing a farmer.
 */
exports.zDeleteFarmerDto = {
    params: zod_1.z.object({
        id: zBigIntId("Farmer ID"),
    }),
};
