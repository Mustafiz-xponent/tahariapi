import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth";
import * as deviceTokenController from "@/modules/deviceTokens/deviceTokens.controller";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Register device token
router.post("/register", deviceTokenController.registerToken);

// Unregister device token
router.post("/unregister", deviceTokenController.unregisterToken);

// Get my tokens
router.get("/my-tokens", deviceTokenController.getMyTokens);

// Send test notification
router.post("/test", deviceTokenController.sendTestNotification);

export default router;
