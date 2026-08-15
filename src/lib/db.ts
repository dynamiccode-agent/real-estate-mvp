import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
export const db = connectionString ? neon(connectionString) : null;

