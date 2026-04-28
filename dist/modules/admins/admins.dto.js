"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteAdminDto = exports.zGetAdminDto = void 0;
const zod_1 = __importDefault(require("zod"));
/**
 * Returns a Zod schema for a positive integer ID, with the given field name used
 * for error messages.
 * @param fieldName The name of the field, used for error messages.
 * @returns A Zod schema for a positive integer ID.
 */
const zBigIntId = (fieldName) => zod_1.default
    .union([zod_1.default.string(), zod_1.default.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
/*
 **   Base Schema: Admin ID Param
 */
const zAdminIdParam = zod_1.default.object({
    id: zBigIntId("Admin ID"),
});
/*
 **  Schema: Get Admin by ID (Route Param)
 */
exports.zGetAdminDto = { params: zAdminIdParam };
/*
 **  Schema: Delete Admin by ID (Route Param)
 */
exports.zDeleteAdminDto = { params: zAdminIdParam };
