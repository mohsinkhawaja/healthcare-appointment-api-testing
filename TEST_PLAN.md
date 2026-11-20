# Appointment scheduling test plan

## Coverage

The fixture models 30-minute appointments and one provider with capacity for one appointment per offered slot. Equal instants expressed with different offsets conflict. Adjacent offered slots are allowed. The read-only role can view bookings and cannot create them. A failed reschedule leaves the old booking accepted. A successful reschedule links the old and replacement records. Canceling an accepted appointment frees its slot.

Negative partitions include missing or invalid authorization, unsupported API version, invalid timezone, unknown event type, malformed attendee, unknown synthetic patient reference, closed states, reversed/equal time windows, missing UTC offset, and times just outside the slot grid. The fixture deliberately returns slot timestamps in UTC and groups them by UTC date, regardless of the accepted timezone preference.

## Exit criteria

Each fixture case must pass with the expected status, and checks must confirm the resulting state when a write is accepted or rejected. Attach JUnit evidence to CI. Use the configured Cal.com suite separately for upstream verification. For a real installation, read its capacity, availability, and permission settings before judging whether a conflict is a defect.

## Limits

This is scheduling QA with synthetic identifiers. It does not implement medical records, healthcare compliance, multi-provider capacity, real notifications, or multi-booking concurrency. The optional integration requires a separately configured instance and includes no credentials.
