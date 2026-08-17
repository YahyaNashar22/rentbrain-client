# RentBrain web client

React frontend for the RentBrain expert-services and jobs marketplace.

## Local setup

1. Copy `.env.example` to `.env` if the API is not running at the default URL.
2. Run `npm install`.
3. Start the backend on port 5000 and this app with `npm run dev` (port 3000).

The client keeps the short-lived access token in memory. The backend owns the
rotating refresh token in an HttpOnly cookie, so both apps must use HTTPS in
production and the backend must list the exact frontend origin in `CORS_ORIGINS`.

## Production

Run `npm run build` and serve `dist/` from a host configured to rewrite unknown
routes to `index.html`. Set `VITE_API_URL` at build time to the public API base.
Do not deploy a payment checkout until the selected Wish Money or bank adapter
has replaced the backend's manual integration.
