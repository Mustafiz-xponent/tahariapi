/**
 * Data Transfer Objects (DTOs) for the Farmer entity
 * These interfaces define the expected shape of data when creating or updating a farmer.
 * You can also use these types with validation libraries like Zod or Joi if needed.
 */
import { z } from "zod";
const bdPhoneValidator = z
  .string()
  .regex(/^\+8801[3-9]\d{8}$/, "Must be a valid Bangladeshi phone number")
  .trim();
const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });
/**
 * Zod schema for creating a new farmer.
 * Validates all required fields necessary for creation.
 */
export const zCreateFarmerDto = {
  body: z.object({
    name: z.string().min(1, "Name is required"),
    farmName: z.string().min(1, "Farm name is required"),
    address: z.string().min(1, "Address is required"),
    contactInfo: bdPhoneValidator.optional(),
  }),
};
/**
 * TypeScript type inferred from create schema.
 * Use this type in services or elsewhere.
 */
type CreateFarmerBodyDto = z.infer<typeof zCreateFarmerDto.body>;
export type CreateFarmerDto = {
  body: CreateFarmerBodyDto;
};

/**
 * Zod schema for getting all farmers.
 */
export const zGetAllFarmersDto = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(10),
    sort: z.enum(["asc", "desc"]).optional().default("desc"),
  }),
};
type GetAllFarmersQueryDto = z.infer<typeof zGetAllFarmersDto.query>;
export type GetAllFarmerDto = {
  query: GetAllFarmersQueryDto;
};
/**
 * Get single farmer by ID schema
 **/
export const zGetFarmerDto = {
  params: z.object({
    id: zBigIntId("Farmer ID"),
  }),
};
type GetFarmerParamsDto = z.infer<typeof zGetFarmerDto.params>;
export type GetFarmerDto = {
  params: GetFarmerParamsDto;
};
/**
 * Zod schema for updating a farmer.
 * All fields are optional to support partial updates.
 */
export const zUpdateFarmerDto = {
  params: z.object({
    id: zBigIntId("Farmer ID"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    farmName: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    contactInfo: bdPhoneValidator.optional(),
  }),
};

/**
 * TypeScript type inferred from update schema.
 */
type UpdateFarmerParamsDto = z.infer<typeof zUpdateFarmerDto.params>;
type UpdateFarmerBodyDto = z.infer<typeof zUpdateFarmerDto.body>;
export type UpdateFarmerDto = {
  params: UpdateFarmerParamsDto;
  body: UpdateFarmerBodyDto;
};
/**
 * Zod schema for deleing a farmer.
 */
export const zDeleteFarmerDto = {
  params: z.object({
    id: zBigIntId("Farmer ID"),
  }),
};
type DeleteFarmerParamsDto = z.infer<typeof zDeleteFarmerDto.params>;
export type DeleteFarmerDto = {
  params: DeleteFarmerParamsDto;
};
