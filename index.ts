import * as path from 'path'; //import path from 'path';
import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import serveStatic, { ServeStaticOptions } from 'serve-static';
import { ServerResponse } from 'http';

const app = express();
const port = process.env.PORT || 8000;

app.use(cookieParser());
app.enable('trust proxy');
app.set('etag', 'strong');

app.use(compression());

// health check
app.use('/health', (_req, res) => res.send(`👍 Ok ${process.env.WEBSITE_INSTANCE_ID} ${process.env.COMPUTERNAME} ${process.env.HOSTNAME}`));

// Serve static files
const uiRoot = path.resolve(__dirname, `./static`);
for (const route of ['/', '/images', '/docs']) {
  app.use(
    route,
    serveStatic(uiRoot, {
      acceptRanges: false,
      maxAge: 604800000 // milliseconds
    } as ServeStaticOptions),
  );
}

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
