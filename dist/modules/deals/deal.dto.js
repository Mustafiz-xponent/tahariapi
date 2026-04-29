"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zDeleteDealDto = exports.zUpdateDealDto = exports.zGetDealDto = exports.zGetAllDealsDto = exports.zCreateDealDto = void 0;
const zod_1 = require("zod");
const client_1 = require("../../generated/prisma/client");
/**
 * Returns a Zod schema for a positive integer ID, with the given field name used
 * for error messages.
 * @param fieldName The name of the field, used for error messages.
 * @returns A Zod schema for a positive integer ID.
 */
const zBigIntId = (fieldName) => zod_1.z
    .union([zod_1.z.string(), zod_1.z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
    message: `${fieldName} must be a positive integer`,
});
exports.zCreateDealDto = {
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(3).max(100),
        description: zod_1.z.string().max(255).optional(),
        discountType: zod_1.z.nativeEnum(client_1.DiscountType),
        discountValue: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .refine((val) => !isNaN(Number(val)), {
            message: "Must be a valid number",
        })
            .transform((val) => Number(val)),
        startDate: zod_1.z.coerce.date(),
        endDate: zod_1.z.coerce.date(),
        isGlobal: zod_1.z.boolean().optional().default(false),
        productIds: zod_1.z
            .array(zBigIntId("Product ID"))
            .optional()
            .refine((arr) => arr === undefined || arr.length > 0, {
            message: "At least one product must be selected",
        }),
    })
        .refine((data) => {
        // Business rule: if isGlobal is true, no productIds should be provided
        if (data.isGlobal && data.productIds?.length) {
            return false;
        }
        return true;
    }, {
        message: "Global deals should not have product IDs",
        path: ["productIds"],
    })
        .refine((data) => {
        // endDate must be after startDate
        return data.endDate > data.startDate;
    }, {
        message: "End date must be after start date",
        path: ["endDate"],
    })
        .refine((data) => {
        if (!data.isGlobal &&
            (!data.productIds || data.productIds.length === 0)) {
            return false;
        }
        return true;
    }, {
        message: "At least one product must be selected for non-global deals",
        path: ["productIds"],
    }),
};
/*
 ** Schema: Get All Deals (Query Parameters)
 ** Includes pagination, sorting
 */
exports.zGetAllDealsDto = {
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().positive().optional().default(1),
        limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
        sort: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        isActive: zod_1.z.coerce.boolean().optional(),
    }),
};
/*
 **   Schema: Get Single Deal by ID (Route Param)
 */
exports.zGetDealDto = {
    params: zod_1.z.object({
        id: zBigIntId("Deal ID"),
    }),
};
/**
 * Schema: Update Deal
 * @description All fields optional, but validated similarly to creation
 **/
exports.zUpdateDealDto = {
    params: zod_1.z.object({
        id: zBigIntId("Deal ID"),
    }),
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(3).max(100).optional(),
        description: zod_1.z.string().max(255).optional(),
        discountType: zod_1.z.nativeEnum(client_1.DiscountType).optional(),
        discountValue: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .refine((val) => !isNaN(Number(val)), {
            message: "Must be a valid number",
        })
            .transform((val) => Number(val))
            .optional(),
        startDate: zod_1.z.coerce.date().optional(),
        endDate: zod_1.z.coerce.date().optional(),
        isGlobal: zod_1.z.boolean().optional(),
        productIds: zod_1.z
            .array(zBigIntId("Product ID"))
            .optional()
            .refine((arr) => arr === undefined || arr.length > 0, {
            message: "At least one product must be selected",
        }),
    })
        .refine((data) => {
        if (data.startDate && data.endDate) {
            return data.endDate > data.startDate;
        }
        return true;
    }, {
        message: "End date must be after start date",
        path: ["endDate"],
    })
        .refine((data) => {
        if (data.isGlobal && data.productIds?.length) {
            return false;
        }
        return true;
    }, {
        message: "Global deals should not have product IDs",
        path: ["productIds"],
    })
        .refine((data) => {
        if (data.isGlobal === false &&
            (!data.productIds || data.productIds.length === 0)) {
            return false;
        }
        return true;
    }, {
        message: "At least one product must be selected for non-global deals",
        path: ["productIds"],
    }),
};
/*
 ** Schema: Delete Deal by ID (Route Param)
 */
exports.zDeleteDealDto = {
    params: zod_1.z.object({
        id: zBigIntId("Deal ID"),
    }),
};
