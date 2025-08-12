import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"]
});