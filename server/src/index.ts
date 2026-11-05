
import "dotenv/config"
import { createApp } from "./app.js"
import { createMemoryStore } from "./memoryStore.js"
import { createSupabaseStore } from "./supabaseStore.js"
import { dataSource, listPackages, getPackage, listDestinations, getDestination } from "./catalog.js"
import { requireAuth } from "./auth.js"
import { supabase } from "./supabase.js"

const defaultDailyLimit = Number(process.env.DEFAULT_DAILY_LIMIT ?? 3)

const store = supabase
  ? createSupabaseStore(defaultDailyLimit)
  : createMemoryStore([], defaultDailyLimit)

const catalog = {
  listPackages,
  getPackage,
  listDestinations,
  getDestination,
}

const app = createApp({
  catalog,
  store,
  requireAuth,
  dataSource,
  defaultDailyLimit,
})

const port = Number(process.env.PORT ?? 4000)

app.listen(port, () => {
  console.log(`SouthQuest API running at http://localhost:${port}`)
  console.log(`Data source: ${dataSource}`)
})
