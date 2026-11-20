import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { makeRouter } from './routes.mjs';

export function createFixture() {
  const route = makeRouter();
  return createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    let body = {};
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 64 * 1024) {
          res.writeHead(413).end(JSON.stringify({ code: 'PAYLOAD_TOO_LARGE' }));
          return;
        }
        chunks.push(chunk);
      }
      if (chunks.length) body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      res.writeHead(400).end(JSON.stringify({ code: 'INVALID_JSON' }));
      return;
    }
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      const [status, payload] = route({ method: req.method, path: url.pathname, query: url.searchParams, body, headers: req.headers });
      res.writeHead(status).end(JSON.stringify(payload));
    } catch (error) {
      console.error(error);
      res.writeHead(500).end(JSON.stringify({ code: 'FIXTURE_ERROR' }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 8080);
  createFixture().listen(port, '127.0.0.1', () => console.log(`Fixture: http://127.0.0.1:${port}`));
}
