# Putting the app on your Namecheap domain

Serve the frontend and backend on your Namecheap domain with HTTPS using a reverse proxy (Nginx) and Let’s Encrypt on your app server.

## Overview

- **Frontend:** `https://lifedashboard.fit` (and `https://www.lifedashboard.fit`) → app on port 3000  
- **Backend API:** `https://api.lifedashboard.fit` → Flask on port 5000  

Your app (PM2) keeps listening on `localhost:3000` and `localhost:5000`. Nginx handles the domain, SSL, and forwards to those ports.

---

## 1. Point the domain to your server (Namecheap DNS)

In **Namecheap → Domain List → Manage → Advanced DNS**:

| Type | Host | Value | TTL |
|------|------|--------|-----|
| A     | `@`   | `YOUR_SERVER_IP` | Automatic |
| A     | `www` | `YOUR_SERVER_IP` | Automatic |
| A     | `api` | `YOUR_SERVER_IP` | Automatic |

Replace `YOUR_SERVER_IP` with the public IP of the machine where the app and Nginx run.  
Wait for DNS to propagate (minutes to a few hours). Check with:

```bash
dig lifedashboard.fit +short
dig api.lifedashboard.fit +short
```

---

## 2. Install Nginx and Certbot on the server

On your Ubuntu/Zorin app server:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 3. Add Nginx config for your domain

Create a config (or use the one in the repo, already for lifedashboard.fit):

```bash
sudo nano /etc/nginx/sites-available/life-dashboard
```

Paste (and adjust domain names):

```nginx
# Frontend: lifedashboard.fit and www
server {
    listen 80;
    server_name lifedashboard.fit www.lifedashboard.fit;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API: api.lifedashboard.fit
server {
    listen 80;
    server_name api.lifedashboard.fit;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and test:

```bash
j
```

---

## 4. Get HTTPS (Let’s Encrypt)

Run Certbot so it configures SSL for the names in your Nginx config:

```bash
sudo certbot --nginx -d lifedashboard.fit -d www.lifedashboard.fit -d api.lifedashboard.fit
```

Follow the prompts (email, agree to terms). Certbot will add HTTPS and auto-renewal.

After that:

- **Frontend:** https://lifedashboard.fit and https://www.lifedashboard.fit  
- **API:** https://api.lifedashboard.fit  

---

## 5. Point the frontend at the API domain

Your frontend must call the API using the public URL (e.g. `https://api.lifedashboard.fit`), not `localhost:5000`.

- If you use **Vite**: set the API base URL via an env variable, e.g. in `.env.production`:
  ```env
  VITE_API_URL=https://api.lifedashboard.fit
  ```
  Then in code use `import.meta.env.VITE_API_URL` for API requests.
- Rebuild and redeploy after changing this (push to `main` so CI/CD runs), or set the same variable in your build pipeline.

---

## 6. Optional: config in the repo

Example Nginx configs are in `deploy/nginx/`. To use them:

1. Copy to the server (already set for lifedashboard.fit):
   ```bash
   sudo cp deploy/nginx/life-dashboard.conf /etc/nginx/sites-available/life-dashboard
   sudo ln -s /etc/nginx/sites-available/life-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
2. Then run Certbot as in step 4.

---

## Troubleshooting: Certbot "Error getting validation data"

If Certbot says the Certificate Authority could not fetch `http://lifedashboard.fit/.well-known/acme-challenge/...`, the CA is reaching your server IP but cannot get a response on **port 80**. Fix the following on the server.

### 1. Open port 80 (and 443) in the firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
sudo ufw status
```

If UFW was inactive, enable it only after 80/443 are allowed so you don’t lock yourself out.

### 2. Confirm Nginx is listening and the site is enabled

```bash
sudo systemctl status nginx
sudo nginx -t
# Should list your server_name in the default or life-dashboard config
ls -la /etc/nginx/sites-enabled/
```

Reload Nginx after any config change:

```bash
sudo systemctl reload nginx
```

### 3. Test Nginx locally (on the server)

If `curl http://lifedashboard.fit/` **hangs** when you run it on the same machine (or same Wi‑Fi) as the server, that’s normal: many home routers don’t support “NAT loopback,” so the request never comes back. Test Nginx on the server instead:

```bash
# On the server – should return immediately with 200 or 302
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1/ -H "Host: lifedashboard.fit"
curl -sS -o /dev/null -w "%{http_code}" http://127.0.0.1/ -H "Host: api.lifedashboard.fit"
```

You want to see `200` or `302`. If you get that, Nginx is fine; the problem is reaching the server from the internet.

### 4. Test from the internet

From **another network** (e.g. phone on cellular, or a friend’s machine), not from the server itself:

```bash
curl -I http://lifedashboard.fit/
curl -I http://api.lifedashboard.fit/
```

You should get HTTP/1.1 200 or 302, not “Connection refused” or timeout. If it fails (or curl hangs), port 80 is not reachable from the internet. Use an online "open port check" tool for 111.68.99.90 port 80; if it shows "closed," fix the firewall or router (steps 1 and 5).

### 5. If the server is behind a home router

On the router, set **Port forwarding**: external ports **80** and **443** → this machine’s **LAN IP** (e.g. 192.168.1.x), same ports. Then run the `curl` tests again from outside.

### 6. Retry Certbot

After port 80 is reachable:

```bash
sudo certbot --nginx -d lifedashboard.fit -d www.lifedashboard.fit -d api.lifedashboard.fit
```

---

## Summary

| URL | Proxies to | App |
|-----|------------|-----|
| https://lifedashboard.fit, https://www.lifedashboard.fit | localhost:3000 | Frontend (PM2: life-dashboard-web) |
| https://api.lifedashboard.fit | localhost:5000 | Backend (PM2: life-dashboard-api) |

PM2 and your CI/CD stay unchanged; Nginx and Certbot handle the domain and HTTPS.
