import mysql from "mysql2/promise";

/**
 * En Cloud Run:
 * - Si INSTANCE_CONNECTION_NAME existe, conectamos por socket Unix (/cloudsql/...).
 * - Si no existe, caemos a TCP con DB_HOST/DB_PORT (útil en local).
 */
const base = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  waitForConnections: true,
  charset: "utf8mb4_general_ci" as const,
};

export const pool = mysql.createPool(
  process.env.INSTANCE_CONNECTION_NAME
    ? {
        ...base,
        socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      }
    : {
        ...base,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      }
);

if (process.env.INSTANCE_CONNECTION_NAME) {
  console.log(
    `[db] Using UNIX socket at /cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
  );
} else {
  console.log(
    `[db] Using TCP at ${process.env.DB_HOST}:${process.env.DB_PORT ? process.env.DB_PORT : 3306}`
  );
}