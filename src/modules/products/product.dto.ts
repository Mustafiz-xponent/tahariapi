/**
 * Data Transfer Objects (DTOs) for the Product entity
 * Updated to handle image uploads with product operations
 */
import { z } from "zod";
import { ProductUnitType } from "@/generated/prisma/client";

const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
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

export const zCreateProductDto = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    unitPrice: z.coerce.number().positive("Unit price must be positive"),
    unitType: z.nativeEnum(ProductUnitType),
    packageSize: z.coerce.number().positive("Package size must be positive"),
    stockQuantity: z.coerce
      .number()
      .int()
      .nonnegative("Stock quantity must be a non-negative integer")
      .optional(),
    reorderLevel: z.coerce
      .number()
      .int()
      .nonnegative("Reorder level must be a non-negative integer")
      .optional(),
    isSubscription: z
      .union([z.boolean(), z.string()])
      .transform((val) =>
        typeof val === "string" ? val.toLowerCase() === "true" : val
      )
      .optional(),
    isPreorder: z
      .union([z.boolean(), z.string()])
      .transform((val) =>
        typeof val === "string" ? val.toLowerCase() === "true" : val
      )
      .optional(),
    preorderAvailabilityDate: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .transform((val) => (val ? new Date(val) : undefined))
      .optional(),
    categoryId: zBigIntId("Category ID"),
    farmerId: zBigIntId("Farmer ID"),
  }),
};

/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
type CreateProductBodyDto = z.infer<typeof zCreateProductDto.body>;
export type CreateProductDto = {
  body: CreateProductBodyDto;
};
/*
 ** Schema: Get All Products (Query Parameters)
 ** Includes pagination, sorting, filtering
 */
export const zGetAllProductsDto = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),

    isSubscription: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((val) => val === "true"),

    isPreorder: z
      .union([z.literal("true"), z.literal("false")])
      .optional()
      .transform((val) => val === "true"),
    name: z.string().optional(),
    categoryId: zBigIntId("Category Id").optional(),
  }),
};
type GetAllProductsQueryDto = z.infer<typeof zGetAllProductsDto.query>;
export type GetAllProductsDto = {
  query: GetAllProductsQueryDto;
};

/*
 ** Schema: Get single product by Id
 */
export const zGetProductDto = {
  params: z.object({
    id: zBigIntId("Product Id"),
  }),
};
type GetProductPramsDto = z.infer<typeof zGetProductDto.params>;
export type GetProductDto = {
  params: GetProductPramsDto;
};
/**
 * Zod schema for updating a product.
 * All fields are optional to support partial updates.
 * Images are handled separately through file upload.
 */
export const zUpdateProductDto = {
  params: z.object({
    id: zBigIntId("Product ID"),
  }),
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    unitPrice: z.coerce
      .number()
      .positive("Unit price must be positive")
      .optional(),
    unitType: z.nativeEnum(ProductUnitType).optional(),
    packageSize: z.coerce
      .number()
      .positive("Package size must be positive")
      .optional(),
    stockQuantity: z.coerce
      .number()
      .int()
      .nonnegative("Stock quantity must be a non-negative integer")
      .optional(),
    reorderLevel: z.coerce
      .number()
      .int()
      .nonnegative("Reorder level must be a non-negative integer")
      .optional(),
    isSubscription: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          return val.toLowerCase() === "true";
        }
        return val;
      })
      .optional(),
    isPreorder: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          return val.toLowerCase() === "true";
        }
        return val;
      })
      .optional(),
    preorderAvailabilityDate: z
      .string()
      .datetime()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    imageUrls: z.array(z.string().url()).optional(), // For manual URL management
    categoryId: zBigIntId("Category ID").optional(),
    farmerId: zBigIntId("Farmer Id").optional(),
    replaceImages: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "string") {
          return val.toLowerCase() === "true";
        }
        return val;
      })
      .optional()
      .default(false), // Whether to replace existing images or add to them
  }),
};

/**
 * TypeScript type inferred from update schema.
 */
type UpdateProductParamsDto = z.infer<typeof zUpdateProductDto.params>;
type UpdateProductBodyDto = z.infer<typeof zUpdateProductDto.body>;
export type UpdateProductDto = {
  params: UpdateProductParamsDto;
  body: UpdateProductBodyDto;
};
/*
 ** Schema: Delete single product by Id
 */
export const zDeleteProductDto = {
  params: z.object({
    id: zBigIntId("Product Id"),
  }),
};
type DeleteProductPramsDto = z.infer<typeof zDeleteProductDto.params>;
export type DeleteProductDto = {
  params: DeleteProductPramsDto;
};
