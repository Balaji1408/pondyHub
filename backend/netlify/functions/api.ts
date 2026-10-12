import type { APIGatewayProxyEvent, Context } from 'aws-lambda';
import serverless from 'serverless-http';
import { connectLambda } from '@netlify/blobs';
import { app } from '../../src/app.js';
import { ensureSchema } from '../../src/db.js';
import { useBlobUploads } from '../../src/uploads.js';

useBlobUploads();

const schemaReady = ensureSchema().catch((err) => console.error('Schema migration failed', err));
const handle = serverless(app, { binary: ['image/*'] });

export const handler = async (
  event: APIGatewayProxyEvent & { blobs?: string },
  context: Context
) => {
  if (event.blobs) connectLambda({ blobs: event.blobs, headers: event.headers as Record<string, string> });
  await schemaReady;
  // netlify.toml rewrites /api/* to this function; the Express routes are mounted under /api.
  event.path = event.path.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '/api');
  return handle(event, context);
};
