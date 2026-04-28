"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zGetAllCustomersDto = exports.zUpdateCustomerDto = exports.zCreateCustomerDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the Customer entity
 * These interfaces define the expected shape of data when creating or updating a customer.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
/**
 * Zod schema for creating a new customer.
 * Validates all required fields necessary for creation.
 */
exports.zCreateCustomerDto = zod_1.z.object({
    firebaseUid: zod_1.z.string().min(1, "Firebase UID is required"),
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email format"),
    phone: zod_1.z
        .string()
        .regex(/^\+?[\d\s()-]{7,}$/, "Invalid phone number format")
        .optional(),
    address: zod_1.z.string().min(1, "Address is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
});
/**
 * Zod schema for updating a customer.
 * All fields are optional to support partial updates.
 */
exports.zUpdateCustomerDto = zod_1.z.object({
    firebaseUid: zod_1.z.string().min(1, "Firebase UID is required").optional(),
    name: zod_1.z.string().min(1, "Name is required").optional(),
    email: zod_1.z.string().email("Invalid email format").optional(),
    phone: zod_1.z
        .string()
        .regex(/^\+?[\d\s()-]{7,}$/, "Invalid phone number format")
        .optional(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .optional(),
});
/*
 ** Schema: Get All Customers (Query Parameters)
 ** Includes pagination, sorting
 */
exports.zGetAllCustomersDto = {
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().optional().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
        sort: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        search: zod_1.z.string().trim().optional(),
    }),
};
