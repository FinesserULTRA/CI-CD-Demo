# Deploy: GitHub Actions CI/CD on your app server (Ubuntu / Zorin)

This project uses GitHub Actions to run tests, build the frontend, and deploy both backend (Flask via Gunicorn) and frontend (static via `serve`) on your app server using **PM2**.

**Using a Namecheap domain?** See **[NAMECHEAP-DOMAIN.md](NAMECHEAP-DOMAIN.md)** for DNS, Nginx reverse proxy, and HTTPS with Let’s Encrypt.

## 1. Install prerequisites on the app server

On your Ubuntu/Zorin 18 machine (the app server), install:

```bash
# Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11 (or 3.10+)
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip

# PM2 (global)
sudo npm install -g pm2
```

If your system uses an externally-managed Python (e.g. Ubuntu 24+), use a venv for the backend:

```bash
cd /path/to/life_dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Then in `ecosystem.config.cjs` you can set the interpreter to the venv Python, or run the deploy job (which uses the runner’s Python) as-is.

## 2. Register a self-hosted GitHub Actions runner

So that the **Deploy** job runs on this machine:

1. In GitHub: **Settings → Actions → Runners → New self-hosted runner**.
2. Pick **Linux** and **x64** (or ARM if needed), then run the commands GitHub shows, e.g.:

```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/YOUR_ORG/life_dashboard --token YOUR_TOKEN
./run.sh
```

To run the runner as a service (recommended):

```bash
sudo ./svc.sh install
sudo ./svc.sh start
```

Use your repo URL and the token from the GitHub “Add runner” page.

## 3. What the pipeline does

| Step    | Where it runs | What it does |
|---------|----------------|--------------|
| **Test**  | GitHub (ubuntu-latest) | Installs backend + frontend deps, runs `pytest backend/tests/` and `npm run test` in `frontend/`. |
| **Build** | GitHub (ubuntu-latest) | Builds frontend (`npm run build`), uploads `frontend/dist` as an artifact. |
| **Deploy** | Your app server (self-hosted) | Checkout, downloads artifact into `frontend/dist`, installs backend deps, runs `pm2 start` then hands off to systemd so PM2 survives the job (one-time: run the `pm2 startup` sudo command; see below). |

Deploy **only** runs on **push to `main`** (not on pull requests).

## 4. PM2 one-time setup

The runner kills processes when the job ends, so the workflow starts PM2 via systemd (`sudo systemctl start pm2-$USER`). **Once per server**: run `pm2 save` then `pm2 startup`, then run the **exact** `sudo env PATH=... pm2 startup systemd -u YOUR_USER --hp /home/YOUR_USER` command it prints. After that, each deploy will keep PM2 running.

## 5. PM2 processes

- **life-dashboard-api**: Gunicorn serving the Flask app on `http://0.0.0.0:5000`.
- **life-dashboard-web**: Static frontend via `npx serve -s dist -l 3000`.

Useful commands on the server:

```bash
pm2 status
pm2 logs
pm2 restart all
```

## 6. Optional: lockfile for frontend


For reliable CI installs, add a lockfile in the frontend:

```bash
cd frontend && npm install && cd ..
```

Commit `frontend/package-lock.json`. The workflow uses `npm ci` and expects this file; if you don’t add it, change the workflow to `npm install` and remove `cache-dependency-path` for the frontend.
