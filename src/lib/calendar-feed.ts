import { addDays, addMinutes, startOfDay } from "date-fns";
import { async as icalAsync, expandRecurringEvent } from "node-ical";
import type { ExistingBooking } from "./slots";
import { downloadCalendarFeed } from "./calendar-feed-download";

export const calendarUnavailable = "Kalender eksternal sedang tidak dapat diperiksa. Silakan coba lagi.";

export class CalendarFeedError extends Error {}

async function parseFeed(body: string) {
  const text = body.trim();
  if (!/^BEGIN:VCALENDAR\r?\n/i.test(text) || !/\r?\nEND:VCALENDAR$/i.test(text)) {
    throw new Error("Invalid iCalendar feed");
  }
  // shortcut: the parser does not expand RDATE or THISANDFUTURE; reject those feeds until it does.
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  if (/^RDATE[:;]|^RECURRENCE-ID;[^:\n]*\bRANGE=THISANDFUTURE/im.test(unfolded)) {
    throw new Error("Unsupported iCalendar recurrence");
  }
  if (/^RRULE:[^\n]*\bFREQ=(SECONDLY|MINUTELY)\b/im.test(unfolded)) {
    throw new Error("Calendar recurrence is too frequent");
  }
  const data = await icalAsync.parseICS(text);
  if (!data.vcalendar) throw new Error("Missing iCalendar component");
  if (Object.keys(data).length > 2000) throw new Error("Calendar has too many components");
  return data;
}

type Calendar = Awaited<ReturnType<typeof parseFeed>>;
const feeds = new Map<string, { calendar: Calendar; expires: number }>();
const downloads = new Map<string, Promise<Calendar>>();

async function loadCalendar(url: string, fresh: boolean) {
  const cached = feeds.get(url);
  if (!fresh && cached && cached.expires > Date.now()) return cached.calendar;
  const pending = downloads.get(url);
  if (pending) return pending;
  if (downloads.size >= 10) throw new Error("Too many calendar downloads");

  const download = downloadCalendarFeed(url).then(parseFeed).then((calendar) => {
    feeds.delete(url);
    const oldest = feeds.keys().next();
    if (feeds.size >= 32 && !oldest.done) feeds.delete(oldest.value);
    feeds.set(url, { calendar, expires: Date.now() + 60_000 });
    return calendar;
  }).catch((error) => {
    feeds.delete(url);
    throw error;
  }).finally(() => downloads.delete(url));
  downloads.set(url, download);
  return download;
}

function busyPeriods(calendar: Calendar, day: Date, bufferMinutes: number): ExistingBooking[] {
  const from = startOfDay(day);
  const to = addMinutes(addDays(from, 1), bufferMinutes);
  const busy: ExistingBooking[] = [];
  function add(startTime: Date, endTime: Date) {
    if (!Number.isFinite(+startTime) || !Number.isFinite(+endTime) || endTime < startTime) {
      throw new Error("Invalid iCalendar dates");
    }
    if (startTime < endTime && startTime < to && endTime > from) {
      busy.push({ startTime: new Date(startTime), endTime: new Date(endTime) });
    }
  }

  for (const item of Object.values(calendar)) {
    if (item?.type === "VFREEBUSY") {
      for (const period of item.freebusy ?? []) {
        if (period.type !== "FREE") add(period.start, period.end);
      }
    } else if (item?.type === "VEVENT") {
      for (const { start, end, event } of expandRecurringEvent(item, {
        from, to, expandOngoing: true, maxIterations: 5000,
      })) {
        if (event.status !== "CANCELLED" && event.transparency !== "TRANSPARENT" &&
            event["MICROSOFT-CDO-BUSYSTATUS"] !== "FREE") {
          add(start, end);
        }
      }
    }
  }
  return busy;
}

export async function parseCalendarBusyPeriods(body: string, day: Date, bufferMinutes = 0) {
  return busyPeriods(await parseFeed(body), day, bufferMinutes);
}

export async function getCalendarBusyPeriods(
  url: string | null | undefined,
  day: Date,
  bufferMinutes = 0,
  fresh = false,
): Promise<ExistingBooking[]> {
  if (!url) return [];
  try {
    return busyPeriods(await loadCalendar(url, fresh), day, bufferMinutes);
  } catch {
    // Feed URLs and parser errors can contain private calendar details.
    throw new CalendarFeedError(calendarUnavailable);
  }
}
