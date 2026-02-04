import "dotenv/config"
import { defineConfig } from "drizzle-kit"

export default defineConfig({
  out: "./data/migrations",
  schema: "./data/schema/*",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: {
    url: "./data/postgres",
  },
  migrations: {
    table: "migrations",
    schema: "public",
  },
})
