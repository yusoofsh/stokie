/** biome-ignore-all lint/performance/noNamespaceImport: true */

import { PGlite } from "@electric-sql/pglite"
import { drizzle } from "drizzle-orm/pglite"
import * as schema from "../../data/schema"

const client = new PGlite("./data/postgres")

export const db = drizzle({
  client,
  schema,
})
