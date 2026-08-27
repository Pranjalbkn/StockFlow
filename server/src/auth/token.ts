import jwt from "jsonwebtoken";

export type AuthToken = {
  userId: number;
  accountId: number;
  role: "OWNER" | "MANAGER" | "SALESPERSON";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set in server/.env");
  }

  return secret;
}

export function createToken(payload: AuthToken) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "1d" });
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, getJwtSecret()) as AuthToken;

  return {
    ...payload,
    accountId: payload.accountId ?? payload.userId,
  };
}
