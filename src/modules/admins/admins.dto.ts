import z from "zod";

/**
 * Returns a Zod schema for a positive integer ID, with the given field name used
 * for error messages.
 * @param fieldName The name of the field, used for error messages.
 * @returns A Zod schema for a positive integer ID.
 */
const zBigIntId = (fieldName: string) =>
  z
    .union([z.string(), z.number()])
    .refine((val) => val !== "", { message: `${fieldName} is required` })
    .transform((val) => BigInt(val))
    .refine((val) => val > 0n, {
      message: `${fieldName} must be a positive integer`,
    });

/*
 **   Base Schema: Admin ID Param
 */
const zAdminIdParam = z.object({
  id: zBigIntId("Admin ID"),
});
type AdminIdParamsDto = z.infer<typeof zAdminIdParam>;

/*
 **  Schema: Get Admin by ID (Route Param)
 */
export const zGetAdminDto = { params: zAdminIdParam };
export type GetAdminDto = { params: AdminIdParamsDto };

/*
 **  Schema: Delete Admin by ID (Route Param)
 */
export const zDeleteAdminDto = { params: zAdminIdParam };
export type DeleteAdminDto = { params: AdminIdParamsDto };
