import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { User } from "@/generated/prisma/client";

/**
 * Generate auth token
 */
export function generateAuthToken(user: Omit<User, "passwordHash">): {
  token: string;
  user: Omit<User, "passwordHash">;
} {
  const jwtSecret: Secret = process.env.JWT_SECRET as Secret;
  const options: SignOptions = { expiresIn: 7 * 24 * 60 * 60 }; // 7 days

  const token = jwt.sign(
    {
      userId: user.userId,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    options
  );

  return { token, user };
}
