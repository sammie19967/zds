// Cloudinary signed upload helper
// Requires serverless function at /api/cloudinary-signature (or VITE_CLOUDINARY_SIGNING_URL) to generate signature
// Server env (Vercel Project Settings): CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

export async function uploadAdminPassportToCloudinary(file) {
  if (!file) return '';

  const signingUrl = import.meta.env.VITE_CLOUDINARY_SIGNING_URL || '/api/cloudinary-signature';

  // 1) Ask our serverless function for a signature and upload params
  const sigRes = await fetch(signingUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'admin_admissions' }),
    credentials: 'include',
  });

  if (!sigRes.ok) {
    const text = await sigRes.text();
    throw new Error(`Failed to get Cloudinary signature: ${sigRes.status} ${text}`);
  }

  const { signature, timestamp, apiKey, folder, cloudName } = await sigRes.json();

  // 2) Upload to Cloudinary with the signed params
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);
  form.append('folder', folder);

  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.secure_url || json.url || '';
}
