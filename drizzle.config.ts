import { defineConfig } from "drizzle-kit";

// Reads DATABASE_URL from the environment, with a local fallback for
// development. This lets you point at a production database with:
//   DATABASE_URL="postgresql://..." npx drizzle-kit push
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
