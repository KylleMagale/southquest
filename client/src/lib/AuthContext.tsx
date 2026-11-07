import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./supabase"

export type Role = "customer" | "admin"

export interface Profile {
  fullName: string | null
  phone: string | null
  role: Role
}

interface AuthResult {
  error?: string
}

interface AuthContextValue {
  configured: boolean
  loading: boolean
  user: User | null
  profile: Profile | null
  role: Role
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (input: {
    email: string
    password: string
    fullName: string
    phone: string
  }) => Promise<AuthResult & { needsConfirmation?: boolean }>
  signOut: () => Promise<void>

  updateProfile: (input: { fullName: string; phone: string }) => Promise<AuthResult>
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function friendlyError(message: string): string {
  const m = message.toLowerCase()

  if (m.includes("invalid login credentials")) {
    return "Email or password is incorrect."
  }

  if (m.includes("email not confirmed")) {
    return "Please confirm your email first, then log in."
  }

  if (
    m.includes("already registered") ||
    m.includes("already been registered")
  ) {
    return "An account with this email already exists. Try logging in."
  }

  if (m.includes("password") && m.includes("characters")) {
    return "Password must be at least 8 characters."
  }

  if (m.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again."
  }

  if (m.includes("fetch") || m.includes("network")) {
    return "Can't reach the server. Check your connection."
  }

  return "Something went wrong. Please try again."
}

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [sessionLoading, setSessionLoading] = useState(
    supabase !== null,
  )
  const [user, setUser] = useState<User | null>(null)

  // undefined = not loaded yet; null = loaded but no profile row.
  const [profile, setProfile] = useState<
    Profile | null | undefined
  >(undefined)

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setSessionLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      },
    )

    return () => sub.subscription.unsubscribe()
  }, [])

  // Load the profile separately from the auth callback.
  const userId = user?.id

  useEffect(() => {
    if (!supabase || !userId) {
      setProfile(undefined)
      return
    }

    let cancelled = false

    supabase
      .from("profiles")
      .select("full_name, phone, role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return

        setProfile(
          data
            ? {
                fullName: data.full_name,
                phone: data.phone,
                role:
                  data.role === "admin" ? "admin" : "customer",
              }
            : null,
        )
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (email, password) => {
      if (!supabase) {
        return { error: "Sign-in is not set up yet." }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      return error
        ? { error: friendlyError(error.message) }
        : {}
    },
    [],
  )

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ email, password, fullName, phone }) => {
      if (!supabase) {
        return { error: "Sign-up is not set up yet." }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      })

      if (error) {
        return { error: friendlyError(error.message) }
      }

      // When email confirmation is enabled, Supabase returns
      // no session until the confirmation link is clicked.
      return { needsConfirmation: !data.session }
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }

    setProfile(undefined)
  }, [])

  
  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async ({ fullName, phone }) => {
      if (!supabase || !userId) return { error: "Please log in again." }

      // RLS only lets a user change their own row, and never their role.
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", userId)
        .select("full_name, phone, role")
        .maybeSingle()

      if (error || !data) {
        return { error: "We couldn't save your changes. Please try again." }
      }

      setProfile({
        fullName: data.full_name,
        phone: data.phone,
        role: data.role === "admin" ? "admin" : "customer",
      })
      return {}
    },
    [userId],
  )

  const changePassword = useCallback<AuthContextValue["changePassword"]>(
    async (currentPassword, newPassword) => {
      if (!supabase || !user?.email) return { error: "Please log in again." }

      // Re-check the current password before allowing a password change.
      const check = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (check.error) return { error: "Your current password is incorrect." }

      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        const m = error.message.toLowerCase()

        if (m.includes("different from the old")) {
          return { error: "Your new password must be different from the old one." }
        }

        return { error: friendlyError(error.message) }
      }

      return {}
    },
    [user?.email],
  )


  
  const value = useMemo<AuthContextValue>(
    () => ({
      configured: supabase !== null,
      loading:
        sessionLoading ||
        (user !== null && profile === undefined),
      user,
      profile: profile ?? null,
      role: profile?.role ?? "customer",
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
    }),
    [
      sessionLoading,
      user,
      profile,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePassword,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }

  return ctx
}