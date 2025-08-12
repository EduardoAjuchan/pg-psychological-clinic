import session from "express-session";

const ONE_DAY = 1000 * 60 * 60 * 24;

export const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "change_me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_DAY
  }
};