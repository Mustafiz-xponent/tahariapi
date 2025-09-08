import jwt from "jsonwebtoken";
import { User } from "@/generated/prisma/client";

const JWT_EXPIRY = "1d";

/**
 * Generate auth token
 */
export function generateAuthToken(user: Omit<User, "passwordHash">): {
  token: string;
  user: Omit<User, "passwordHash">;
} {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET not configured");

  const token = jwt.sign(
    {
      userId: user.userId,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: JWT_EXPIRY }
  );

  return { token, user };
}
