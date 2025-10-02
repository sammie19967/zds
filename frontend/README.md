## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
  npm install jspdf

## Firebase Form Submissions

This app can store Contact form submissions in Firebase Firestore.

Setup steps:

1. Create a Firebase project and enable Firestore (Native mode).
2. Copy `.env.example` to `.env` and fill your Firebase config values:

   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure Firestore Security Rules to allow writes to `submissions` but restrict reads (so public users can submit, but cannot list all submissions from the client):

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /submissions/{docId} {
         allow create: if true;            // anyone can submit
         allow read: if false;             // no public reads
       }

       // Deny everything else by default
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

---

# ZDS Frontend — Full Documentation

## Overview

This is the ZDS frontend web application built with React + Vite. It includes a full Admin suite for managing students, fees, fuel logs, inquiries, expenses, payment history, and admissions, with a consistent design system across all admin components. The app integrates with Firebase (for submissions/data) and Cloudinary (for secure image uploads using a signed server-side endpoint).

## Key Features

- Admin Dashboard with modern, consistent design
- Admin Fees management: course fees, record payments, student balances
- Admin Fuel logs: settings, log entries, daily reports, and KPIs
- Admin Inquiries: search, filters, status badges, expandable messages
- Admin Expenses: employees and expenses CRUD, salary validation, monthly summaries
- Admin Payment History: student picker, stats, styled tables
- Admin Admission Form: multi-step form with drag-and-drop uploads
- Universal Navbar offset solution for main site pages
- Secure Cloudinary uploads via serverless signing
- Firebase integration for form submissions

## Tech Stack

- React 18 + Vite 5
- React Router DOM 7
- Firebase SDK 10
- Express (local signing server for dev)
- Cloudinary (direct uploads via signed requests)
- ESLint with React plugin

## Project Structure

```text
frontend/
  api/
    cloudinary-signature.js        # Vercel serverless function for Cloudinary signature
  server/
    cloudinary-signature.js        # Local Express signing server for development
  src/
    admin/
      components/                  # Admin React components (e.g., Fees, Fuel, Expenses, etc.)
      styles/                      # Admin CSS files with component-specific prefixes
    utils/
      cloudinary.js                # Client helper for signed Cloudinary uploads
  public/                          # Static assets (favicon, manifest, robots.txt)
  package.json                     # Scripts and dependencies
  .env                             # Environment variables (local dev)
  .eslintrc.json                   # Lint rules and Node/browser overrides
  README.md                        # This documentation
```

## Environment Variables

Create `frontend/.env` (not committed) and set the following:

- Firebase (client)
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID` (optional)

- Cloudinary (server-only secrets; do NOT prefix with VITE)
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

- Cloudinary signing URL (client uses this to call the server)
  - `VITE_CLOUDINARY_SIGNING_URL` (e.g., `http://localhost:4000/api/cloudinary-signature` in dev; omit in prod to default to `/api/cloudinary-signature`)

## Cloudinary Uploads

- Client helper: `src/utils/cloudinary.js`
  - Calls `VITE_CLOUDINARY_SIGNING_URL` or `/api/cloudinary-signature` to fetch a signature
  - Uploads the file directly to Cloudinary with returned params

- Serverless function (production): `api/cloudinary-signature.js`
  - Vercel exposes it at `https://<your-app>/api/cloudinary-signature`
  - Reads `CLOUDINARY_*` secrets from environment

- Local dev server (optional): `server/cloudinary-signature.js`
  - Run alongside Vite to sign uploads locally
  - Script: `npm run dev` runs both Vite and the local signing server via `concurrently`

## Development

1) Install dependencies

```bash
npm install
```

1) Start dev

```bash
npm run dev
```

This starts:

- Vite dev server (default: `http://localhost:5173`)
- Local signing server (default: `http://localhost:4000`)

Ensure `.env` contains valid Firebase and Cloudinary values.

## Build

```bash
npm run build
npm run preview  # optional local preview of the production build
```

## Deploying to Vercel

- Set project root to `frontend/` so Vercel picks up `api/` for serverless functions
- Configure Environment Variables (Project Settings → Environment Variables):
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - Optionally set `VITE_CLOUDINARY_SIGNING_URL` to `/api/cloudinary-signature` (or leave unset so it defaults to same-origin)
- Do not expose server secrets with a `VITE_` prefix

## Linting & Code Quality

- ESLint config at `frontend/.eslintrc.json`:
  - Browser env for client `src/**`
  - Node env override for `api/**/*.js` and `server/**/*.js` (enables `process.env` without errors)
  - `no-unused-vars` ignores arguments starting with `_` (useful for handlers like `(_, res) => {}`)

Run lints:

```bash
npm run lint
```

## Design System & Styling

- Inter font family; consistent color scheme:
  - Primary: `#3b82f6`
  - Text/Dark: `#1e293b`
  - Background: `#f8fafc`
- Component-specific CSS with unique prefixes to avoid collisions, e.g.:
  - `admin-fees-*`, `admin-fuel-*`, `admin-inquiries-*`, `admin-expenses-*`, `admin-payment-*`, `admin-admission-*`
- Responsive design with breakpoints at 1024px, 768px, 640px/480px
- Consistent cards, shadows, border radii, tables, and form controls across Admin modules

## Admin Modules (Highlights)

- Fees (`src/admin/components/AdminFees.jsx`, `src/admin/styles/AdminFees.css`)
  - Stats, search, course fees editing, payment recording, balances

- Fuel (`src/admin/components/AdminFuel.jsx`, `src/admin/styles/AdminFuel.css`)
  - Month filter, stats (distance, litres, cost, efficiency), logs and reports

- Inquiries (`src/admin/components/AdminInquiries.jsx`, `src/admin/styles/AdminInquiries.css`)
  - Search, month filter, tabs, expandable message cells, status badges

- Expenses (`src/admin/components/AdminExpenses.jsx`, `src/admin/styles/AdminExpenses.css`)
  - Employees and expenses CRUD, salary validation against base salary, profit auto-calculation

- Payment History (`src/admin/components/AdminPaymentHistory.jsx`, `src/admin/styles/AdminPaymentHistory.css`)
  - Student picker, totals, amounts styling, confirmation codes

- Admission Form (`src/admin/components/AdminAdmissionForm.jsx`, `src/admin/styles/AdmissionForm.css`)
  - Multi-step with drag-and-drop uploads, consistent admin styles

- Navbar solution (`src/components/Navbar.css`)
  - Uses CSS custom properties to universally offset content below a fixed navbar on main pages

## Security Considerations

- Never expose `CLOUDINARY_API_SECRET` to the client
- Client talks only to `/api/cloudinary-signature` (or configured signing URL)
- Configure Firestore rules to restrict reads from public clients

## API Endpoints

- `POST /api/cloudinary-signature`
  - Request JSON (subset, all optional except the server fills `timestamp`):
    - `folder`, `public_id`, `eager`, `transformation`, `tags`, `context`, `overwrite`, `invalidate`, `resource_type`, `use_filename`, `unique_filename`
  - Response JSON:
    - `signature`, `timestamp`, `apiKey`, `folder`, `cloudName`, and echoes accepted params

## Troubleshooting

- "process is not defined" in server files
  - Ensure ESLint recognizes Node env via `.eslintrc.json` overrides for `api/**` and `server/**`
- 401 from Cloudinary on upload
  - Verify `CLOUDINARY_*` secrets are set and signature params match the upload request
- CORS errors in dev
  - The local signing server allows common localhost origins on port 3000/5173
- Firebase permission errors
  - Recheck Firestore rules and ensure you’re writing to allowed collections

## License

Proprietary – internal use for ZDS. Update as appropriate.

