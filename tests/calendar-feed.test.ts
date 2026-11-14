import assert from "node:assert/strict";
import test from "node:test";
import { CalendarFeedError, getCalendarBusyPeriods, parseCalendarBusyPeriods } from "../src/lib/calendar-feed";
import { calendarFeedUrl, isPublicCalendarAddress } from "../src/lib/calendar-feed-download";
import { getAvailableSlots } from "../src/lib/slots";

const calendar = (...lines: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//NexCal Test//EN", ...lines, "END:VCALENDAR"].join("\r\n");
const event = (id: string, ...lines: string[]) => ["BEGIN:VEVENT", `UID:${id}`, ...lines, "END:VEVENT"];

test("Outlook busy periods join NexCal bookings without blocking free or adjacent slots", async () => {
  const day = new Date(2035, 0, 8);
  const ics = calendar(
    ...event("overnight", "DTSTART:20350107T233000", "DTEND:20350108T083000"),
    ...event("busy", "DTSTART:20350108T090000", "DTEND:20350108T093000", "X-MICROSOFT-CDO-BUSYSTATUS:BUSY"),
    ...event("free", "DTSTART:20350108T093000", "DTEND:20350108T100000", "X-MICROSOFT-CDO-BUSYSTATUS:FREE"),
    ...event("transparent", "DTSTART:20350108T100000", "DTEND:20350108T103000", "TRANSP:TRANSPARENT"),
    ...event("cancelled", "DTSTART:20350108T103000", "DTEND:20350108T110000", "STATUS:CANCELLED"),
  );
  const busy = await parseCalendarBusyPeriods(ics, day);
  const slots = getAvailableSlots(day, [{ dayOfWeek: day.getDay(), startTime: "08:00", endTime: "11:30" }], [], [
    ...busy,
    { startTime: new Date(2035, 0, 8, 11), endTime: new Date(2035, 0, 8, 11, 30) },
  ], 30);
  assert.deepEqual(slots.filter((slot) => !slot.available).map((slot) => slot.startTime), ["08:00", "09:00", "11:00"]);
});

test("all-day events use local dates and the iCalendar end date is exclusive", async () => {
  const ics = calendar(...event("holiday", "DTSTART;VALUE=DATE:20350107", "DTEND;VALUE=DATE:20350109"));
  assert.deepEqual(await parseCalendarBusyPeriods(ics, new Date(2035, 0, 8)), [{
    startTime: new Date(2035, 0, 7),
    endTime: new Date(2035, 0, 9),
  }]);
  assert.deepEqual(await parseCalendarBusyPeriods(ics, new Date(2035, 0, 9)), []);
});

test("Outlook recurring events honor Windows time zones, exclusions and moved occurrences", async () => {
  const ics = calendar(
    ...event("series", "DTSTART;TZID=Eastern Standard Time:20350309T090000",
      "DTEND;TZID=Eastern Standard Time:20350309T093000", "RRULE:FREQ=WEEKLY;COUNT=4",
      "EXDATE;TZID=Eastern Standard Time:20350323T090000"),
    ...event("series", "RECURRENCE-ID;TZID=Eastern Standard Time:20350330T090000",
      "DTSTART;TZID=Eastern Standard Time:20350331T100000", "DTEND;TZID=Eastern Standard Time:20350331T103000"),
  );
  for (const [day, expected] of [
    [9, "2035-03-09T14:00:00.000Z"], [16, "2035-03-16T13:00:00.000Z"],
    [23, undefined], [30, undefined], [31, "2035-03-31T14:00:00.000Z"],
  ] as const) {
    const result = await parseCalendarBusyPeriods(ics, new Date(2035, 2, day));
    assert.equal(result[0]?.startTime.toISOString(), expected);
    assert.equal(result.length, expected ? 1 : 0);
  }
});

test("VFREEBUSY exposes periods without event details and ignores FREE", async () => {
  const ics = calendar("BEGIN:VFREEBUSY", "UID:busy",
    "FREEBUSY;FBTYPE=FREE:20350108T080000Z/20350108T090000Z",
    "FREEBUSY;FBTYPE=BUSY-UNAVAILABLE:20350108T090000Z/PT30M", "END:VFREEBUSY");
  assert.deepEqual(await parseCalendarBusyPeriods(ics, new Date(2035, 0, 8)), [{
    startTime: new Date("2035-01-08T09:00:00Z"),
    endTime: new Date("2035-01-08T09:30:00Z"),
  }]);
});

test("unreadable and unsupported feeds do not count as an empty calendar", async () => {
  const day = new Date(2035, 0, 8);
  assert.deepEqual(await getCalendarBusyPeriods(null, day), []);
  assert.deepEqual(await parseCalendarBusyPeriods(calendar(), day), []);
  await assert.rejects(parseCalendarBusyPeriods("<html>Sign in</html>", day));
  await assert.rejects(parseCalendarBusyPeriods(calendar(
    ...event("rdate", "DTSTART:20350108T090000", "RDATE:20350109T090000"),
  ), day));
  await assert.rejects(getCalendarBusyPeriods("http://calendar.example.org", day), CalendarFeedError);
});

test("calendar URL validation normalizes webcal and excludes non-public destinations", () => {
  assert.equal(calendarFeedUrl("webcal://outlook.office365.com/calendar.ics?key=example").href,
    "https://outlook.office365.com/calendar.ics?key=example");
  for (const url of ["http://calendar.example.org", "https://user@calendar.example.org",
    "https://calendar.example.org:8443", "https://127.0.0.1", "https://[::1]", "https://localhost"]) {
    assert.throws(() => calendarFeedUrl(url));
  }
  for (const address of ["10.0.0.12", "127.0.0.1", "169.254.0.1", "100.64.0.1", "::1", "fc00::1", "fe80::1"]) {
    assert.equal(isPublicCalendarAddress(address), false, address);
  }
  for (const address of ["1.1.1.1", "2606:4700:4700::1111"]) {
    assert.equal(isPublicCalendarAddress(address), true, address);
  }
});
