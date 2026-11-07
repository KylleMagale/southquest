import "dotenv/config"
import { createApp } from "./app.js"
import { requireAdmin, requireAuth } from "./auth.js"
import * as catalog from "./catalog.js"
import { createMemoryStore, sampleAddons } from "./memoryStore.js"
import { supabase } from "./supabase.js"
import { createSupabaseStore } from "./supabaseStore.js"

const port = Number(process.env.PORT ?? 4000)

const store = supabase
  ? createSupabaseStore(supabase)
  : createMemoryStore(process.env.SAMPLE_PRICES === "true" ? sampleAddons : [])

const app = createApp({
  catalog,
  store,
  content: store,
  requireAuth,
  requireAdmin,
  dataSource: catalog.dataSource,
  defaultDailyLimit: Number(process.env.DEFAULT_DAILY_LIMIT ?? 3),
  corsOrigin: process.env.CLIENT_ORIGIN,
})

app.listen(port, () => {
  console.log(`SouthQuest API on http://localhost:${port} (data: ${catalog.dataSource})`)
})