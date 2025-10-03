import jwt, { SignOptions, JwtPayload, Secret } from "jsonwebtoken";

const SECRET: Secret = (process.env.JWT_SECRET || "") as Secret;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "1h") as SignOptions["expiresIn"];

export type JWTPayload = {
  sub: number;                 // user id
  username: string;
  name: string;
  rol_id: number;
  permisos: string[];          // para RBAC rápido en el middleware
};

export function signAccessToken(payload: JWTPayload) {
  const options: SignOptions = { expiresIn: EXPIRES_IN };
  return jwt.sign(payload, SECRET, options);
}

export function verifyAccessToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, SECRET) as JwtPayload | string;
  if (typeof decoded === "string") {
    throw new Error("INVALID_TOKEN_PAYLOAD");
  }
  return decoded as unknown as JWTPayload;
}
