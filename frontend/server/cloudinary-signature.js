// Local Express server to generate Cloudinary signed upload signatures
// Usage: node server/cloudinary-signature.js
// Env required (in .env at project root):
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.SIGNING_PORT || 4000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000', // common React/Vite dev port
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite default
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })
);

app.post('/api/cloudinary-signature', (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary server env not configured' });
  }

  // Collect allowed params from request body. Only include if truthy.
  const {
    folder = 'admin_admissions',
    public_id,
    eager, // e.g. 'w_400,h_300,c_pad|w_260,h_200,c_crop'
    transformation, // e.g. 'c_limit,w_1000'
    tags, // e.g. 'admin,passport'
    context, // e.g. 'caption=Passport photo|alt=Student passport'
    overwrite, // boolean
    invalidate, // boolean
    resource_type, // 'image' (default), 'raw', etc.
    use_filename, // boolean
    unique_filename, // boolean
  } = req.body || {};

  const timestamp = Math.floor(Date.now() / 1000);

  // Build params object for signing (do not include api_key or file)
  const params = {
    context,
    eager,
    folder,
    invalidate,
    overwrite,
    public_id,
    resource_type,
    tags,
    transformation,
    timestamp,
    unique_filename,
    use_filename,
  };

  // Remove null/undefined/empty values
  const filtered = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    // Cloudinary expects booleans as 'true'/'false'
    .map(([k, v]) => [k, typeof v === 'boolean' ? (v ? 'true' : 'false') : v]);

  // Sort keys alphabetically and join as key=value&...
  const toSign = filtered
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(toSign + apiSecret)
    .digest('hex');

  return res.json({
    signature,
    timestamp,
    apiKey,
    folder,
    cloudName,
    // Echo back accepted params so the client can send them to Cloudinary if desired
    public_id,
    eager,
    transformation,
    tags,
    context,
    overwrite: overwrite === true,
    invalidate: invalidate === true,
    resource_type: resource_type || 'image',
    use_filename: use_filename === true,
    unique_filename: unique_filename === true,
  });
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Cloudinary signing server running on http://localhost:${PORT}`);
});
