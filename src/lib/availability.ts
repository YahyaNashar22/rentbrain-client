export type AvailabilityRule = {
  weekday: number
  startTime: string
  endTime: string
  timezone: string
}

export type AvailabilityOverride = {
  id: number
  date: string
  isAvailable: boolean
  startTime?: string | null
  endTime?: string | null
}

export type AvailabilityCalendar = {
  rules: AvailabilityRule[]
  overrides: AvailabilityOverride[]
  busy: Array<{ startsAt: string; endsAt: string }>
}

export type AvailableSlot = {
  iso: string
  dateLabel: string
  timeLabel: string
}

const SLOT_INTERVAL_MINUTES = 30
const BOOKING_LEAD_TIME_MS = 5 * 60_000

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`

const dateKeyInTimezone = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

const addDays = (dateKey: string, days: number) => {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const weekdayForDate = (dateKey: string) =>
  new Date(`${dateKey}T12:00:00Z`).getUTCDay()

const zonedDateTimeToDate = (
  dateKey: string,
  time: string,
  timezone: string,
) => {
  const [year, month, day] = dateKey.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)
  const desired = Date.UTC(year, month - 1, day, hours, minutes)
  let timestamp = desired
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })

  // Intl exposes timezone-aware parts but not the offset. Iteratively adjust
  // until the formatted instant matches the expert's local date and time.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = formatter.formatToParts(new Date(timestamp))
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value ?? 0)
    const represented = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
    )
    timestamp += desired - represented
  }

  const result = new Date(timestamp)
  const roundTrip = formatter.formatToParts(result)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    roundTrip.find((item) => item.type === type)?.value ?? ""
  const roundTripKey = `${value("year")}-${value("month")}-${value("day")}`
  const roundTripTime = `${value("hour")}:${value("minute")}`

  // A local time can be nonexistent during a daylight-saving transition.
  return roundTripKey === dateKey && roundTripTime === time ? result : null
}

export function buildAvailableSlots(
  calendar: AvailabilityCalendar | undefined,
  durationMinutes: number,
  dayCount = 30,
  now = new Date(),
): AvailableSlot[] {
  if (!calendar?.rules.length || durationMinutes <= 0) return []

  const timezone = calendar.rules[0]?.timezone
  if (!timezone) return []

  try {
    const firstDate = dateKeyInTimezone(now, timezone)
    const latestOverrideByDate = new Map<string, AvailabilityOverride>()
    for (const override of calendar.overrides) {
      const current = latestOverrideByDate.get(override.date)
      if (!current || override.id > current.id) {
        latestOverrideByDate.set(override.date, override)
      }
    }

    const busy = calendar.busy.map((period) => ({
      startsAt: new Date(period.startsAt).getTime(),
      endsAt: new Date(period.endsAt).getTime(),
    }))
    const earliestStart = now.getTime() + BOOKING_LEAD_TIME_MS
    const slots = new Map<string, AvailableSlot>()
    const labelFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    })

    for (let dayOffset = 0; dayOffset < dayCount; dayOffset += 1) {
      const dateKey = addDays(firstDate, dayOffset)
      const override = latestOverrideByDate.get(dateKey)
      if (override && !override.isAvailable) continue

      const windows = override
        ? override.startTime && override.endTime
          ? [{ startTime: override.startTime, endTime: override.endTime }]
          : []
        : calendar.rules.filter(
            (rule) => rule.weekday === weekdayForDate(dateKey),
          )

      for (const window of windows) {
        const windowStart = timeToMinutes(window.startTime)
        const windowEnd = timeToMinutes(window.endTime)
        for (
          let startMinute = windowStart;
          startMinute + durationMinutes <= windowEnd;
          startMinute += SLOT_INTERVAL_MINUTES
        ) {
          const localTime = minutesToTime(startMinute)
          const localEndTime = minutesToTime(startMinute + durationMinutes)
          const startsAt = zonedDateTimeToDate(dateKey, localTime, timezone)
          const endsAt = zonedDateTimeToDate(dateKey, localEndTime, timezone)
          if (!startsAt || !endsAt || startsAt.getTime() < earliestStart) continue

          const overlapsBooking = busy.some(
            (period) =>
              startsAt.getTime() < period.endsAt &&
              endsAt.getTime() > period.startsAt,
          )
          if (overlapsBooking) continue

          const iso = startsAt.toISOString()
          slots.set(iso, {
            iso,
            dateLabel: labelFormatter.format(startsAt),
            timeLabel: `${localTime}–${localEndTime}`,
          })
        }
      }
    }

    return [...slots.values()].sort((left, right) =>
      left.iso.localeCompare(right.iso),
    )
  } catch {
    return []
  }
}
