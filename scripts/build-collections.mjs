import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceDir = join(root, 'test-cases');
const outputDir = join(root, 'collections');
const verify = process.argv.includes('--check');
const schema = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

function buildTestScript(scenario) {
  const { id, status, assertions = {}, capture = {} } = scenario;
  const expected = Array.isArray(status) ? status : [status];
  const lines = [
    `const expectedStatus = ${JSON.stringify(expected)};`,
    'const responseStatus = pm.response.code;',
    `pm.test(${JSON.stringify(`${id} | expected HTTP status`)}, () => {`,
    '  pm.expect(responseStatus).to.be.oneOf(expectedStatus);',
    '});',
    'const get = (key) => pm.variables.get(key);',
  ];
  if (Object.keys(assertions).length || Object.keys(capture).length) {
    lines.push('let data;', 'try { data = pm.response.json(); } catch { data = null; }',
      `pm.test(${JSON.stringify(`${id} | JSON response body`)}, () => {`,
      '  pm.expect(data).not.to.equal(null);',
      '  pm.expect(pm.response.headers.get("Content-Type")).to.match(/json/i);',
      '});');
  }
  for (const [label, check] of Object.entries(assertions)) {
    lines.push(`pm.test(${JSON.stringify(`${id} | ${label}`)}, () => {`,
      `  pm.expect(Boolean(${check})).to.equal(true);`, '});');
  }
  for (const [key, expression] of Object.entries(capture)) {
    lines.push('if (data !== null && expectedStatus.includes(responseStatus)) {',
      `  const value = ${expression};`, '  if (value !== undefined && value !== null) {',
      `    pm.collectionVariables.set(${JSON.stringify(key)}, value);`, '  }', '}');
  }
  return ['(() => {', ...lines.map((line) => `  ${line}`), '})();'];
}

function buildItem(scenario) {
  const { id, title, method, path, headers = {}, body, cookieJar, setup } = scenario;
  const request = { method, header: [], url: `{{baseUrl}}${path}` };
  const event = [{ listen: 'test', script: { type: 'text/javascript', exec: buildTestScript(scenario) } }];
  if (setup) event.unshift({ listen: 'prerequest', script: { type: 'text/javascript', exec: setup } });
  if (body !== undefined) {
    const raw = JSON.stringify(body, null, 2).replace(/"@number:([\w-]+)"/g, '{{\$1}}');
    request.body = { mode: 'raw', raw, options: { raw: { language: 'json' } } };
    request.header.push({ key: 'Content-Type', value: 'application/json' });
  }
  for (const [key, value] of Object.entries(headers)) request.header.push({ key, value });
  return {
    name: `${id} | ${title}`, event, request,
    protocolProfileBehavior: { disableCookies: !cookieJar },
  };
}

if (!verify) await mkdir(outputDir, { recursive: true });
for (const file of (await readdir(sourceDir)).filter((name) => name.endsWith('.json')).sort()) {
  const suite = JSON.parse(await readFile(join(sourceDir, file), 'utf8'));
  const ids = new Set(suite.cases.map((scenario) => scenario.id));
  if (ids.size !== suite.cases.length || !ids.size) throw new Error(`Duplicate or missing case IDs: ${file}`);
  const collection = {
    info: { name: suite.name, description: suite.description, schema },
    variable: Object.entries(suite.variables).map(([key, value]) => ({ key, value })),
    item: suite.cases.map(buildItem),
  };
  const output = join(outputDir, file.replace('.json', '.postman_collection.json'));
  const text = `${JSON.stringify(collection, null, 2)}\n`;
  if (verify) {
    if (await readFile(output, 'utf8') !== text) throw new Error(`Regenerate ${output} with npm run build`);
  } else {
    await writeFile(output, text);
  }
  console.log(`${suite.name}: ${ids.size} cases`);
}
