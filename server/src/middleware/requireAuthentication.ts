import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../auth/token.js";

export function requireAuthentication(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = request.cookies.accessToken;

  if (!token) {
    response.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    response.locals.user = verifyToken(token);
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired session" });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!allowedRoles.includes(response.locals.user.role)) {
      response.status(403).json({ message: "You do not have permission" });
      return;
    }

    next();
  };
}
