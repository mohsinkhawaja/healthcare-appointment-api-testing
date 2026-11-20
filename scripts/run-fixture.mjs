import { createRequire } from 'node:module';
import { once } from 'node:events';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createFixture } from '../fixture/server.mjs';

const require = createRequire(import.meta.url);
const newman = require(process.env.NEWMAN_MODULE || 'newman');
const stem = process.argv[2] || 'fixture';
const collection = JSON.parse(await readFile(new URL(`../collections/${stem}.postman_collection.json`, import.meta.url), 'utf8'));
const reports = new URL('../reports/', import.meta.url);
await mkdir(reports, { recursive: true });
const server = createFixture().listen(0, '127.0.0.1');
await once(server, 'listening');
try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const result = await new Promise((resolve, reject) => {
    newman.run({
      collection, envVar: [{ key: 'baseUrl', value: baseUrl }],
      reporters: ['cli', 'junit'], reporter: { junit: { export: 'reports/fixture.junit.xml' } },
      timeoutRequest: 5000, timeoutScript: 3000, timeout: 60000,
    }, (error, summary) => error ? reject(error) : resolve(summary));
  });
  const { requests, assertions } = result.run.stats;
  const totals = {
    target: 'local synthetic fixture', collection: collection.info.name, newman: newman.version || '6.2.1',
    requests: requests.total, assertions: assertions.total, failures: result.run.failures.length,
  };
  await writeFile(new URL('fixture-summary.json', reports), JSON.stringify(totals, null, 2) + '\n');
  console.log(JSON.stringify(totals));
  process.exitCode = totals.failures ? 1 : 0;
} finally {
  await new Promise((resolve) => server.close(resolve));
}
