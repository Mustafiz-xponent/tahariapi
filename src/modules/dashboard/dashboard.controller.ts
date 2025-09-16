import httpStatus from "http-status";
import { Response, Request } from "express";
import asyncHandler from "@/utils/asyncHandler";
import sendResponse from "@/utils/sendResponse";
import { GetSalesOverviewDto } from "@/modules/dashboard/dashboard.dto";
import * as dasboardService from "@/modules/dashboard/dashboard.services";
import {
  DashboardSummaryResult,
  SalesOverviewResult,
} from "@/modules/dashboard/dashboard.interfaces";

export const getDashboardSummary = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const summary = await dasboardService.getDashboardSummary();

    sendResponse<DashboardSummaryResult>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Dashboard summary retrieved successfully",
      data: summary,
    });
  }
);

export const getSalesOverview = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const year = req.query
      .year as unknown as GetSalesOverviewDto["query"]["year"];

    const result = await dasboardService.getSalesOverview(year);
    sendResponse<Omit<SalesOverviewResult, "meta">>(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Sales overview retrieved successfully",
      data: {
        data: result.data,
        labels: result.labels,
        year: result.year,
      },
      meta: result.meta,
    });
  }
);
