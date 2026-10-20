import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";

// Prisma 7 requires a driver adapter. Relative file: paths resolve from the backend/ directory.
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });

export const prisma = new PrismaClient({ adapter });
