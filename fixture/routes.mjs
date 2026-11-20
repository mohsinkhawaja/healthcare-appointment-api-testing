import { readFileSync } from 'node:fs';

const clinic = JSON.parse(readFileSync(new URL('../test-data/clinic-calendar.json', import.meta.url)));
const success = (data, status = 200) => [status, { status: 'success', data }];
const fail = (status, code) => [status, { status: 'error', error: { code } }];
const apiVersion = { booking: '2026-02-25', slots: '2024-09-04' };

function supportedZone(zone) {
  try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true; } catch { return false; }
}

export function makeRouter() {
  const bookings = new Map();
  const isTaken = (start, exclude) => Array.from(bookings.values()).some((booking) =>
    booking.status === 'accepted' && booking.uid !== exclude && booking.start === start);

  const format = (booking) => ({ ...booking, duration: clinic.durationMinutes });

  function checkSlot(value, exclude) {
    if (typeof value !== 'string' || !/T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return fail(400, 'OFFSET_REQUIRED');
    const time = Date.parse(value);
    if (!Number.isFinite(time)) return fail(400, 'INVALID_START');
    if (time < Date.parse(clinic.today)) return fail(422, 'PAST_SLOT');
    const start = new Date(time).toISOString();
    if (!clinic.slots.includes(start)) return fail(422, 'SLOT_OUTSIDE_SCHEDULE');
    if (isTaken(start, exclude)) return fail(409, 'SLOT_TAKEN');
    return start;
  }

  function makeBooking(start, attendee, link = {}) {
    const id = bookings.size + 1;
    const end = new Date(Date.parse(start) + clinic.durationMinutes * 60_000).toISOString();
    const booking = { id, uid: `synth-booking-${id}`, start, end, status: 'accepted', eventTypeId: clinic.eventTypeId, attendees: [attendee], ...link };
    bookings.set(booking.uid, booking);
    return booking;
  }

  return ({ method, path, query, body, headers }) => {
    if (path === '/health') return [200, { ready: true }];
    const auth = headers.authorization;
    if (auth !== 'Bearer fixture-scheduler' && auth !== 'Bearer fixture-reader') return fail(401, 'AUTH_REQUIRED');
    const expectedVersion = path === '/v2/slots' ? apiVersion.slots : apiVersion.booking;
    if (headers['cal-api-version'] !== expectedVersion) return fail(400, 'WRONG_API_VERSION');
    if (method !== 'GET' && auth !== 'Bearer fixture-scheduler') return fail(403, 'READ_ONLY_ROLE');
    if (path === '/v2/slots' && method === 'GET') {
      if (Number(query.get('eventTypeId')) !== clinic.eventTypeId) return fail(404, 'EVENT_TYPE_NOT_FOUND');
      const from = Date.parse(query.get('start'));
      const to = Date.parse(query.get('end'));
      if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) return fail(400, 'INVALID_WINDOW');
      if (!supportedZone(query.get('timeZone') || 'UTC')) return fail(400, 'INVALID_TIME_ZONE');
      const slots = {};
      for (const start of clinic.slots) {
        const ms = Date.parse(start);
        if (ms < from || ms >= to || isTaken(start)) continue;
        (slots[start.slice(0, 10)] ||= []).push({ start });
      }
      return success(slots);
    }
    if (path === '/v2/bookings' && method === 'GET') return success(Array.from(bookings.values(), format));
    if (path === '/v2/bookings' && method === 'POST') {
      if (body.eventTypeId !== clinic.eventTypeId) return fail(404, 'EVENT_TYPE_NOT_FOUND');
      const attendee = body.attendee;
      if (!attendee || typeof attendee.name !== 'string' || !attendee.name.trim() || !/^[^@]+@example\.test$/.test(attendee.email)) return fail(422, 'INVALID_SYNTHETIC_ATTENDEE');
      if (!clinic.patientReferences.includes(body.bookingFieldsResponses?.patientReference)) return fail(422, 'PATIENT_REFERENCE_INVALID');
      if (typeof attendee.timeZone !== 'string' || !supportedZone(attendee.timeZone)) return fail(422, 'INVALID_TIME_ZONE');
      const slot = checkSlot(body.start);
      return typeof slot === 'string' ? success(format(makeBooking(slot, attendee)), 201) : slot;
    }
    const match = path.match(/^\/v2\/bookings\/([^/]+)(?:\/(cancel|reschedule))?$/);
    if (!match) return fail(404, 'ROUTE_NOT_FOUND');
    const booking = bookings.get(match[1]);
    if (!booking) return fail(404, 'BOOKING_NOT_FOUND');
    if (method === 'GET' && !match[2]) return success(format(booking));
    if (method !== 'POST' || !match[2]) return fail(404, 'ROUTE_NOT_FOUND');
    if (booking.status !== 'accepted') return fail(409, 'BOOKING_CLOSED');
    if (match[2] === 'cancel') {
      if (typeof body.cancellationReason !== 'string' || !body.cancellationReason.trim()) return fail(422, 'REASON_REQUIRED');
      booking.status = 'cancelled';
      booking.cancellationReason = body.cancellationReason;
      return success(format(booking));
    }
    const slot = checkSlot(body.start, booking.uid);
    if (typeof slot !== 'string') return slot;
    if (slot === booking.start) return fail(409, 'SAME_SLOT');
    const replacement = makeBooking(slot, booking.attendees[0], { rescheduledFromUid: booking.uid });
    booking.status = 'cancelled';
    booking.rescheduledToUid = replacement.uid;
    return success(format(replacement), 201);
  };
}
