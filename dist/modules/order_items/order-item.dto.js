"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zUpdateOrderItemDto = exports.zCreateOrderItemsDto = exports.zCreateOrderItemDto = void 0;
/**
 * Data Transfer Objects (DTOs) for the OrderItem entity
 * These interfaces define the expected shape of data when creating or updating an order item.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
const zod_1 = require("zod");
const client_1 = require("../../generated/prisma/client");
// Id validation
const idSchema = zod_1.z.coerce.bigint().refine((val) => val > 0n, {
    message: "ID must be a positive integer",
});
// Validation for subtotal based on quantity and unitPrice
const subtotalValidation = (data) => {
    return (Math.abs(data.subtotal - data.quantity * data.unitPrice * data.packageSize) < 0.01); // Allow small floating-point errors
};
/**
 * Zod schema for creating a new order item.
 * Validates all required fields necessary for creation.
 */
exports.zCreateOrderItemDto = zod_1.z
    .object({
    orderId: idSchema,
    productId: idSchema,
    quantity: zod_1.z.number().int().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    unitType: zod_1.z.nativeEnum(client_1.ProductUnitType),
    packageSize: zod_1.z.coerce.number().positive("Package size must be positive"),
    subtotal: zod_1.z.number().nonnegative(),
})
    .refine(subtotalValidation);
/**
 * Zod schema for creating multiple order items.
 * Validates all required fields necessary for creation.
 */
exports.zCreateOrderItemsDto = zod_1.z.object({
    orderId: idSchema,
    items: zod_1.z
        .array(zod_1.z
        .object({
        productId: idSchema,
        quantity: zod_1.z.number().int().positive(),
        unitPrice: zod_1.z.number().nonnegative(),
        unitType: zod_1.z.nativeEnum(client_1.ProductUnitType),
        packageSize: zod_1.z.coerce
            .number()
            .positive("Package size must be positive"),
        subtotal: zod_1.z.number().nonnegative(),
    })
        .refine(subtotalValidation))
        .min(1, "At least one order item is required"),
});
// /**
//  * Zod schema for creating a new order item.
//  * Validates all required fields necessary for creation.
//  */
// export const zCreateOrderItemDto = z
//   .object({
//     quantity: z.number().int().positive("Quantity must be a positive integer"),
//     unitPrice: z.number().nonnegative("Unit price must be non-negative"),
//     subtotal: z.number().nonnegative("Subtotal must be non-negative"),
//     orderId: z
//       .union([z.string(), z.number()])
//       .transform(BigInt)
//       .refine((val) => val > 0n, {
//         message: "Order ID must be a positive integer",
//       }),
//     productId: z
//       .union([z.string(), z.number()])
//       .transform(BigInt)
//       .refine((val) => val > 0n, {
//         message: "Product ID must be a positive integer",
//       }),
//   })
//   .refine(subtotalValidation, {
//     message: "Subtotal must equal quantity * unitPrice",
//     path: ["subtotal"],
//   });
// /**
//  * TypeScript type inferred from create schema.
//  * Use this type in services or elsewhere.
//  */
// export type CreateOrderItemDto = z.infer<typeof zCreateOrderItemDto>;
/**
 * Zod schema for updating an order item.
 * All fields are optional to support partial updates.
 */
exports.zUpdateOrderItemDto = zod_1.z
    .object({
    quantity: zod_1.z
        .number()
        .int()
        .positive("Quantity must be a positive integer")
        .optional(),
    unitPrice: zod_1.z
        .number()
        .nonnegative("Unit price must be non-negative")
        .optional(),
    unitType: zod_1.z.nativeEnum(client_1.ProductUnitType).optional(),
    packageSize: zod_1.z
        .number()
        .positive("Package size must be positive")
        .optional(),
    subtotal: zod_1.z
        .number()
        .nonnegative("Subtotal must be non-negative")
        .optional(),
    orderId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Order ID must be a positive integer",
    })
        .optional(),
    productId: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .transform(BigInt)
        .refine((val) => val > 0n, {
        message: "Product ID must be a positive integer",
    })
        .optional(),
})
    .refine((data) => {
    if (data.quantity !== undefined &&
        data.unitPrice !== undefined &&
        data.subtotal !== undefined &&
        data.packageSize !== undefined) {
        return subtotalValidation({
            quantity: data.quantity,
            unitPrice: data.unitPrice,
            packageSize: data.packageSize,
            subtotal: data.subtotal,
        });
    }
    return true;
}, {
    message: "Subtotal must equal quantity * unitPrice * packageSize",
    path: ["subtotal"],
});
