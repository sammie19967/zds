// Cloudinary unsigned upload helper
// Requires the following env vars in your Vite project (.env):
// - VITE_CLOUDINARY_CLOUD_NAME
// - VITE_CLOUDINARY_UPLOAD_PRESET (unsigned preset)

export async function uploadAdminPassportToCloudinary(file) {
  if (!file) return '';

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary env missing: please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  // Optional: folder to organize uploads
  form.append('folder', 'admin_admissions');

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
