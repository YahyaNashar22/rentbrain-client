import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api, refreshAccessToken, setAccessToken } from "../lib/api"
import type { User } from "../lib/types"

type RegisterInput = {
  firstName: string
  lastName: string
  email: string
  password: string
  timezone: string
  acceptTerms: true
  acceptPrivacy: true
}

type AuthValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async (): Promise<void> => {
    const current = await api<User>("/users/me", { auth: true })
    setUser(current)
  }

  useEffect(() => {
    void (async () => {
      try {
        if (await refreshAccessToken()) await refreshUser()
      } catch {
        setAccessToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const tokens = await api<{ accessToken: string }>("/auth/login", {
          method: "POST",
          body: { email, password },
        })
        setAccessToken(tokens.accessToken)
        await refreshUser()
      },
      register: async (input) => {
        await api("/auth/register", { method: "POST", body: input })
      },
      logout: async () => {
        try {
          await api("/auth/logout", { method: "POST", body: {} })
        } finally {
          setAccessToken(null)
          setUser(null)
        }
      },
      refreshUser,
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthValue => {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth must be used inside AuthProvider")
  return value
}
