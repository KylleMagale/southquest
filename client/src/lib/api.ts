import { useCallback, useEffect, useState } from "react"
import { supabase } from "./supabase"

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ""

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function authHeader(): Promise<Record<string, string>> {
  if (!supabase) return {}

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface FetchOptions {
  method?: "GET" | "POST"
  body?: unknown
  /** Send the signed-in user's access token. */
  auth?: boolean
  signal?: AbortSignal
}

export async function apiFetch<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(opts.body !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...(opts.auth ? await authHeader() : {}),
  }

  let res: Response

  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: opts.method ?? "GET",
      headers,
      body:
        opts.body !== undefined
          ? JSON.stringify(opts.body)
          : undefined,
      signal: opts.signal,
    })
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err

    throw new ApiError(
      0,
      "Can't reach the server. Check your connection and try again.",
    )
  }

  if (!res.ok) {
    let message = "Something went wrong. Please try again."

    try {
      const json = (await res.json()) as { error?: string }
      if (json.error) message = json.error
    } catch {
      /* Keep the default message. */
    }

    throw new ApiError(res.status, message)
  }

  return (await res.json()) as T
}

type Status = "loading" | "ok" | "not-found" | "error"

/** GET a path on load. Pass { auth: true } for protected endpoints. */
export function useApi<T>(
  path: string,
  opts: { auth?: boolean } = {},
) {
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<Status>("loading")
  const [tick, setTick] = useState(0)
  const auth = opts.auth ?? false

  useEffect(() => {
    const ctrl = new AbortController()

    setStatus("loading")

    apiFetch<T>(path, { auth, signal: ctrl.signal })
      .then((json) => {
        setData(json)
        setStatus("ok")
      })
      .catch((err: Error) => {
        if (err.name === "AbortError") return

        setStatus(
          err instanceof ApiError && err.status === 404
            ? "not-found"
            : "error",
        )
      })

    return () => ctrl.abort()
  }, [path, auth, tick])

  const retry = useCallback(() => setTick((t) => t + 1), [])

  return { data, status, retry }
}