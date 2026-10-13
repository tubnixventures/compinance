import express from 'express';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { app as honoApp } from './src/app';
import { seedInitialData } from './src/seed';
import { logger } from './src/utils/logger';

dotenv.config();

async function startServer() {
  await seedInitialData();

  const server = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Bridge Hono backend routes into Express server
  server.all(['/api', '/api/*', '/doc', '/doc/*', '/docs', '/docs/*', '/health'], async (req, res) => {
    try {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, val] of Object.entries(req.headers)) {
        if (Array.isArray(val)) {
          val.forEach((v) => headers.append(key, v));
        } else if (val !== undefined) {
          headers.set(key, val);
        }
      }

      let body: any = undefined;
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
      }

      const webReq = new Request(url, {
        method: req.method,
        headers,
        body,
        duplex: body ? 'half' : undefined,
      } as any);

      const honoRes = await honoApp.fetch(webReq);

      res.status(honoRes.status);
      honoRes.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          res.append('Set-Cookie', val);
        } else {
          res.setHeader(key, val);
        }
      });

      const resBuffer = await honoRes.arrayBuffer();
      res.send(Buffer.from(resBuffer));
    } catch (err: any) {
      logger.error('API Router Error', err);
      res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
  });

  // Vite development middleware for full-stack React SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    server.use(vite.middlewares);
  } else {
    server.use(express.static('dist'));
  }

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Compinance Server listening on http://0.0.0.0:${PORT}`);
    logger.info(`Open API Documentation available at http://0.0.0.0:${PORT}/docs`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
