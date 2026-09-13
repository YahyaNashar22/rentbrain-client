export type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: "user" | "admin"
  status: "active" | "suspended" | "closed"
  preferredLanguage: string
  country?: string | null
  city?: string | null
  timezone: string
  avatarUrl?: string | null
  emailVerifiedAt: string
  marketingOptIn: boolean
}

export type Category = {
  id: number
  name: string
  slug: string
  description?: string | null
  isActive: boolean
}
export type Specialization = {
  id: number
  categoryId: number
  name: string
  slug: string
  isActive: boolean
}

export type Service = {
  id: number
  expertId: number
  categoryId: number
  specializationId?: number | null
  title: string
  description: string
  durationMinutes: number
  price: string
  currency: string
  deliveryMode: "online" | "in_person" | "hybrid"
  status: "draft" | "published" | "paused" | "archived"
}

export type Expert = {
  userId: number
  firstName: string
  lastName: string
  avatarUrl?: string | null
  country?: string | null
  city?: string | null
  timezone?: string
  professionalTitle: string
  biography: string
  yearsExperience: number
  languages: string[]
  averageRating: string
  reviewCount: number
  completedBookings: number
  verificationStatus?: "not_submitted" | "pending" | "verified" | "rejected"
  isPublished?: boolean
  specializations?: Specialization[]
  services?: Service[]
}

export type Job = {
  id: string
  clientId: number
  categoryId: number
  specializationId?: number | null
  title: string
  description: string
  budgetMin?: string | null
  budgetMax?: string | null
  currency: string
  location?: string | null
  isRemote: boolean
  requiredSkills: string[]
  applicationDeadline?: string | null
  status: "draft" | "open" | "pending_payment" | "in_progress" | "completed" | "cancelled" | "closed" | "moderated"
  createdAt: string
}

export type Application = {
  id: string
  jobId: string
  expertId: number
  coverLetter: string
  proposedAmount: string
  currency: string
  estimatedDurationDays: number
  status: "pending" | "payment_pending" | "accepted" | "rejected" | "withdrawn"
  createdAt: string
}

export type Booking = {
  id: string
  clientId: number
  expertId: number
  serviceId: number
  startsAt: string
  endsAt: string
  timezone: string
  meetingMethod: string
  total: string
  expertEarnings: string
  currency: string
  status: string
  cancellationReason?: string | null
}

export type Notification = {
  id: string
  type: string
  title: string
  body: string
  readAt?: string | null
  createdAt: string
}

export type Paged<T> = {
  items: T[]
  pagination: { page: number; limit: number; total: number }
}
