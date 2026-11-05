
import type { NextFunction, Request, Response } from "express"
import { supabase } from "./supabase.js"

export interface AuthUser {
  id: string
  email: string | null
  fullName: string | null
  phone: string | null
  role: "customer" | "admin"
}

/**
 * Verifies the Supabase access token sent as `Authorization: Bearer <token>`
 * and puts the user (with their role from `profiles`) on `res.locals.user`.
 * Roles are always read from the database, never trusted from the client.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!supabase) {
    res.status(503).json({ error: "Authentication is not configured on this server" })
    return
  }

  const header = req.headers.authorization ?? ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
  if (!token) {
    res.status(401).json({ error: "Sign in required" })
    return
  }

  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired session" })
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", data.user.id)
      .maybeSingle()
    if (profileError) throw new Error(profileError.message)

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? null,
      fullName: profile?.full_name ?? null,
      phone: profile?.phone ?? null,
      role: profile?.role === "admin" ? "admin" : "customer",
    }
    res.locals.user = user
    next()
  } catch (err) {
    next(err)
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, (err?: unknown) => {
    if (err) return next(err)
    if ((res.locals.user as AuthUser).role !== "admin") {
      res.status(403).json({ error: "Admins only" })
      return
    }
    next()
  })
}
