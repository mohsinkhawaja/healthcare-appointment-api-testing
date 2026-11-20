# Healthcare Appointment API Testing

Postman and Newman regression tests for a synthetic clinic scheduler. The 33-case fixture suite checks appointment availability, timezone conversion, permissions, capacity, cancellation, and rescheduling. A separate five-case integration collection follows Cal.com v2's booking lifecycle.

## Run locally

Prerequisite: Node.js 22 or later.

```sh
npm ci
npm run verify:collections
npm test
```

The runner provisions a fresh fixture on a loopback port and writes `reports/fixture.junit.xml`. GitHub Actions runs the same commands and uploads the JUnit result. For Postman desktop, run `npm run fixture`, then import `collections/fixture.postman_collection.json` and its [fixture environment](environments/fixture.example.postman_environment.json). Use the collection runner to preserve captured booking IDs. Restart the fixture before repeating the full suite.

## Optional Cal.com v2 integration

Use a disposable self-hosted Cal.com installation with the configured v2 API, a dedicated non-recurring event type, at least two available future slots, no external communications, and a test API token. Use only synthetic participants. Copy the [example environment](environments/cal-local.example.postman_environment.json) to `environments/cal.local.postman_environment.json`. Set `calToken`, `eventTypeId`, `windowStart`, and `windowEnd`. Use an HTTP loopback `baseUrl` without a trailing slash.

```sh
npx --no-install newman run collections/cal-local.postman_collection.json -e environments/cal.local.postman_environment.json --bail
```

The final request cancels the synthetic booking. If a run stops before cleanup, reset the disposable event fixture and check for leftover appointments. The API reference covers [slots](https://cal.com/docs/api-reference/v2/slots/get-available-time-slots-for-an-event-type), [creation](https://cal.com/docs/api-reference/v2/bookings/create-a-booking), [rescheduling](https://cal.com/docs/api-reference/v2/bookings/reschedule-a-booking), and [cancellation](https://cal.com/docs/api-reference/v2/bookings/cancel-a-booking). Configure the software version to support the endpoint version headers in the collection. The baseline reflects the fixture target only.

## How the suite is organized

[`TEST_PLAN.md`](TEST_PLAN.md) explains scope. [`test-cases/`](test-cases/) holds editable contracts and readable matrices. [`test-data/`](test-data/) contains the fixed synthetic calendar. [`collections/`](collections/) holds the generated Postman files. Run `npm run build` after editing a contract. See [`reports/`](reports/) for execution evidence and [`bug-reports/`](bug-reports/) for the defect template.
