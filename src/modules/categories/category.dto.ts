/**
 * Data Transfer Objects (DTOs) for the Category entity
 * These interfaces define the expected shape of data when creating or updating a category.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
import { z } from "zod";

const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });
/**
 * Zod schema for creating a new category.
 * Validates all required fields necessary for creation.
 */
export const zCreateCategoryDto = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
  }),
};
/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
type CreateCategoryBodyDto = z.infer<typeof zCreateCategoryDto.body>;
export type CreateCategoryDto = {
  body: CreateCategoryBodyDto;
};
/**
 * Zod schema for getting a categories.
 */
export const zGetCategoriesDto = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
    search: z.string().optional(),
  }),
};
type GetCategoriesParamsDto = z.infer<typeof zGetCategoriesDto.query>;
export type GetCategoriesDto = {
  query: GetCategoriesParamsDto;
};

/**
 * Zod schema for getting a category by ID.
 */
export const zGetCategoryDto = {
  params: z.object({
    id: zBigIntId("Category ID"),
  }),
};
type GetCategoryParamsDto = z.infer<typeof zGetCategoryDto.params>;
export type GetCategoryDto = {
  params: GetCategoryParamsDto;
};
/**
 * Zod schema for updating a category.
 * All fields are optional to support partial updates.
 */
export const zUpdateCategoryDto = {
  params: z.object({
    id: zBigIntId("Category ID"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
};
type UpdateCategoryParamsDto = z.infer<typeof zUpdateCategoryDto.params>;
type UpdateCategoryBodyDto = z.infer<typeof zUpdateCategoryDto.body>;

export type UpdateCategoryDto = {
  params: UpdateCategoryParamsDto;
  body: UpdateCategoryBodyDto;
};
/**
 * Zod schema for deleting a category.
 */
export const zDeleteCategoryDto = {
  params: z.object({
    id: zBigIntId("Category ID"),
  }),
};
type DeleteCategoryParamsDto = z.infer<typeof zDeleteCategoryDto.params>;
export type DeleteCategoryDto = {
  params: DeleteCategoryParamsDto;
};
