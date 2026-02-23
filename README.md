# Life Dashboard

Frontend (Vite) + Backend (Flask) with CI/CD via GitHub Actions. Deploys locally on your app server using PM2 and Gunicorn.

## Quick start

- **Backend:** `cd backend && pip install -r requirements.txt && gunicorn -w 2 -b 0.0.0.0:5000 app:app`
- **Frontend:** `cd frontend && npm install && npm run build && npx serve -s dist -l 3000`
- **Both (PM2):** `pm2 start ecosystem.config.cjs`

## CI/CD

- **Tests & build** run on GitHub (push/PR to `main`).
- **Deploy** runs on your **self-hosted** app server (Ubuntu/Zorin) when you push to `main`.

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for installing Node, Python, PM2, and registering the self-hosted runner.
