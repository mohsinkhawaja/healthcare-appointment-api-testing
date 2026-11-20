# Synthetic clinic scheduling contract

Single-provider, capacity-one appointment model with a fixed reference clock.

| ID | Method | Path | Scenario | Status |
| --- | --- | --- | --- | --- |
| AP-01 | `GET` | `/v2/bookings` | Reject missing authorization | 401 |
| AP-02 | `GET` | `/v2/bookings` | Reject invalid bearer | 401 |
| AP-03 | `GET` | `/v2/bookings` | Reject incorrect API version | 400 |
| AP-04 | `GET` | `/v2/bookings` | List initially empty appointments | 200 |
| AP-05 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-07&end=2030-01-08` | Read provider availability in a valid date window | 200 |
| AP-06 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-08&end=2030-01-09` | Ignore out-of-window slots | 200 |
| AP-07 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-07&end=2030-01-08&timeZone=Mars/Olympus` | Reject invalid IANA timezone | 400 |
| AP-08 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-08&end=2030-01-07` | Reject reversed scheduling window | 400 |
| AP-09 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-07&end=2030-01-07` | Reject equal start and end | 400 |
| AP-10 | `GET` | `/v2/slots?eventTypeId=99&start=2030-01-07&end=2030-01-08` | Reject unknown event type availability | 404 |
| AP-11 | `POST` | `/v2/bookings` | Read-only role cannot create an appointment | 403 |
| AP-12 | `POST` | `/v2/bookings` | Reject missing attendee | 422 |
| AP-13 | `POST` | `/v2/bookings` | Reject invalid synthetic reference | 422 |
| AP-14 | `POST` | `/v2/bookings` | Reject offset-free timestamp | 400 |
| AP-15 | `POST` | `/v2/bookings` | Reject past appointment | 422 |
| AP-16 | `POST` | `/v2/bookings` | Reject booking off the slot grid | 422 |
| AP-17 | `POST` | `/v2/bookings` | Create booking from an offset equivalent to UTC | 201 |
| AP-18 | `GET` | `/v2/bookings/{{firstUid}}` | Read booking by captured UID | 200 |
| AP-19 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-07&end=2030-01-08` | Booking consumes the corresponding slot | 200 |
| AP-20 | `POST` | `/v2/bookings` | Different offset spelling for same instant conflicts | 409 |
| AP-21 | `POST` | `/v2/bookings` | Accept booking at immediately adjacent slot | 201 |
| AP-22 | `POST` | `/v2/bookings/{{firstUid}}/reschedule` | Reject reschedule into occupied slot | 409 |
| AP-23 | `GET` | `/v2/bookings/{{firstUid}}` | Failed reschedule preserves original booking | 200 |
| AP-24 | `POST` | `/v2/bookings/{{firstUid}}/reschedule` | Reschedule to free slot | 201 |
| AP-25 | `GET` | `/v2/bookings/{{firstUid}}` | Original booking links to replacement | 200 |
| AP-26 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-07&end=2030-01-08` | Original slot is offered again | 200 |
| AP-27 | `POST` | `/v2/bookings/{{replacementUid}}/cancel` | Reject blank cancellation reason | 422 |
| AP-28 | `POST` | `/v2/bookings/{{replacementUid}}/cancel` | Cancel the replacement appointment | 200 |
| AP-29 | `POST` | `/v2/bookings/{{replacementUid}}/cancel` | Canceling already closed booking is rejected | 409 |
| AP-30 | `POST` | `/v2/bookings/{{replacementUid}}/reschedule` | Canceled booking cannot reschedule | 409 |
| AP-31 | `POST` | `/v2/bookings/{{adjacentUid}}/cancel` | Cancel adjacent appointment and free all slots | 200 |
| AP-32 | `GET` | `/v2/slots?eventTypeId=10&start=2030-01-07&end=2030-01-08` | All slots available after cancellation | 200 |
| AP-33 | `GET` | `/v2/bookings/synth-missing` | Unknown booking ID returns structured 404 | 404 |
