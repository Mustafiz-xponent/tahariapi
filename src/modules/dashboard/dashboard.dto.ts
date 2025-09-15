import z from "zod";

/*
 ** Schema: Get All Deals (Query Parameters)
 ** Includes pagination, sorting
 */
const currentDate = new Date();
export const zGetSalesOverviewDto = {
  query: z.object({
    year: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .default(currentDate.getFullYear()),
  }),
};
type GetSalesOverviewQueryDto = z.infer<typeof zGetSalesOverviewDto.query>;
export type GetSalesOverviewDto = {
  query: GetSalesOverviewQueryDto;
};
