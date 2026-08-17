const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1"
).replace(/\/$/, "")

let accessToken: string | null = null
let refreshPromise: Promise<string | null> | null = null

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "API_ERROR",
    public readonly details?: unknown,
  ) {
    super(message)
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  auth?: boolean
  retry?: boolean
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined
  const contentType = response.headers.get("content-type") ?? ""
  return contentType.includes("application/json")
    ? response.json()
    : response.text()
}

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: "{}",
    })
    if (!response.ok) {
      accessToken = null
      return null
    }
    const payload = (await response.json()) as { data: { accessToken: string } }
    accessToken = payload.data.accessToken
    return accessToken
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    auth = false,
    retry = true,
    headers: inputHeaders,
    ...requestOptions
  } = options
  const headers = new Headers(inputHeaders)
  if (auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData)
    headers.set("Content-Type", "application/json")

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers,
    credentials: "include",
    ...(body === undefined
      ? {}
      : { body: isFormData ? body : JSON.stringify(body) }),
  })

  if (
    response.status === 401 &&
    auth &&
    retry &&
    (await refreshAccessToken())
  ) {
    return api<T>(path, { ...options, retry: false })
  }

  const payload = (await parseResponse(response)) as {
    data?: T
    error?: { message?: string; code?: string; details?: unknown }
    message?: string
  } | string | undefined
  if (!response.ok) {
    const error =
      typeof payload === "object" && payload ? payload.error : undefined
    const validationMessage = Array.isArray(error?.details)
      ? error.details
          .map((detail) =>
            detail && typeof detail === "object" && "message" in detail
              ? String(detail.message)
              : "",
          )
          .filter(Boolean)
          .join(". ")
      : ""
    throw new ApiError(
      validationMessage || error?.message || "Something went wrong",
      response.status,
      error?.code,
      error?.details,
    )
  }
  if (payload && typeof payload === "object" && "data" in payload)
    return payload.data as T
  return payload as T
}

export const queryString = (
  values: Record<string, string | number | boolean | undefined | null>,
): string => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value))
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

export const assetUrl = (path?: string | null): string | undefined => {
  if (!path) return undefined
  if (/^https?:\/\//.test(path)) return path
  return `${API_URL.replace(/\/api\/v1$/, "")}${path}`
}

export const downloadApiFile = async (
  path: string,
  filename: string,
): Promise<void> => {
  const request = () =>
    fetch(`${API_URL}${path.replace(/^\/api\/v1/, "")}`, {
      credentials: "include",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    })
  let response = await request()
  if (response.status === 401 && (await refreshAccessToken()))
    response = await request()
  if (!response.ok)
    throw new ApiError("The file could not be downloaded", response.status)
  const href = URL.createObjectURL(await response.blob())
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(href)
}
