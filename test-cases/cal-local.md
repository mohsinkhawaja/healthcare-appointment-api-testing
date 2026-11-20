# Cal.com v2 booking integration

Opt-in smoke suite for a configured disposable Cal.com v2 instance.

| ID | Method | Path | Scenario | Status |
| --- | --- | --- | --- | --- |
| CAL-01 | `GET` | `/v2/slots?eventTypeId={{eventTypeId}}&start={{windowStart}}&end={{windowEnd}}&timeZone=UTC` | Read two available slots | 200 |
| CAL-02 | `POST` | `/v2/bookings` | Create synthetic appointment in the first slot | 201 |
| CAL-03 | `GET` | `/v2/bookings/{{uid}}` | Retrieve matching appointment by UID | 200 |
| CAL-04 | `POST` | `/v2/bookings/{{uid}}/reschedule` | Reschedule synthetic booking | 201 |
| CAL-05 | `POST` | `/v2/bookings/{{newUid}}/cancel` | Cancel the synthetic appointment | 200 |
