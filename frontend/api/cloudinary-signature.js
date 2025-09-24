// Vercel Serverless Function: Cloudinary signed upload signature
// Env variables required (set in Vercel project settings):
// - CLOUDINARY_CLOUD_NAME
// - CLOUDINARY_API_KEY
// - CLOUDINARY_API_SECRET

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary server env not configured' });
  }

  try {
    const { folder = 'admin_admissions' } = req.body || {};
    const timestamp = Math.floor(Date.now() / 1000);

    // Build params to sign (alphabetically by key, without nulls)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return res.status(200).json({
      signature,
      timestamp,
      apiKey,
      folder,
      cloudName,
    });
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Signature error' });
  }
}
