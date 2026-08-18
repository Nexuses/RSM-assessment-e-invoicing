# Deploy on a VPS (PM2 + nginx + HTTPS)

This app is a Next.js 14 site. Assessment and consultation rows are now stored in **Postgres**. Google Sheets remains a best-effort mirror; PDF reports still go to **AWS S3**; email still goes out over **SMTP** (typically Amazon SES).

Docker is required for the Postgres service, but the Next.js app still runs directly on the host with PM2.

**Baseline:** Ubuntu 22.04 or 24.04, 1+ vCPU, **2 GB RAM** preferred (PDF generation), Node.js **20 LTS**, nginx, certbot, PM2.

Replace `YOUR_DOMAIN` and `YOUR_ORG` below with your values.

---

## 1. Point DNS

Create an A record for `YOUR_DOMAIN` (and `www` if you use it) to the VPS public IP. Wait until it resolves before requesting a certificate.

```bash
dig +short YOUR_DOMAIN
```

---

## 2. Install packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx curl ufw docker.io docker-compose-plugin
```

Node.js 20 LTS (NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should be v20.x
```

PM2:

```bash
sudo npm i -g pm2
```

---

## 3. GitHub deploy key (private repo)

The VPS must clone and pull over SSH without a personal access token or your laptop key.

On the VPS, as the user that will own the app (`root` or a dedicated `deploy` user):

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "vps-deploy-rsm-e-invoicing" -f ~/.ssh/rsm_e_invoicing_deploy -N ""
cat ~/.ssh/rsm_e_invoicing_deploy.pub
```

Write the SSH config as a **file** (paste this whole block into the terminal — do not paste the `Host ...` lines by themselves):

```bash
cat > ~/.ssh/config << 'EOF'
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/rsm_e_invoicing_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config ~/.ssh/rsm_e_invoicing_deploy
```

On GitHub:

1. Open the repository → **Settings** → **Deploy keys** → **Add deploy key**
2. Title: `vps-rsm-e-invoicing` (or the server hostname)
3. Paste the **public** key (`.pub` only)
4. Leave **Allow write access** unchecked (read-only is enough for clone and pull)
5. Add key

Verify, then clone:

```bash
ssh -T git@github.com
# Expected: Hi YOUR_ORG/RSM-assessment-e-invoicing-1! You've successfully authenticated...
# (deploy keys often print the repo name rather than a user)

sudo mkdir -p /var/www
sudo chown "$USER:$USER" /var/www
git clone git@github.com:YOUR_ORG/RSM-assessment-e-invoicing-1.git /var/www/rsm-e-invoicing
```

Clone **without** `sudo`. `sudo git clone` runs as root and will not use `/home/RSMae/.ssh/`.

**Do not:**

- Copy the **private** key into the repo, GitHub, or chat
- Reuse the same deploy key on a second GitHub repo (each deploy key can be attached to only one repo)
- Put a personal access token in the clone URL (it lands in shell history)

---

## 4. Environment

```bash
cd /var/www/rsm-e-invoicing
cp .env.example .env
nano .env
```

Fill every required key:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string used by Prisma |
| `SUBMISSIONS_PASSWORD` | Shared password for `/submissions` |
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | Service account JSON as a **single line** |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Spreadsheet ID (Sheet1 = assessments, Sheet2 = consultations) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET_NAME` / `AWS_REGION` | PDF uploads |
| `FROM_EMAIL` / `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | Outbound email |

Optional: `CONSULTATION_RECIPIENTS` (comma-separated admin emails).

Confirm the Google service account email still has **Editor** access on that spreadsheet.

Keep `.env` on the server only. It is gitignored and must never be committed.

---

## 5. Start Postgres

```bash
cd /var/www/rsm-e-invoicing
docker compose up -d
docker compose ps
```

If your Docker install does not provide the Compose plugin, `npm run db:up` also falls back to `docker-compose`.

---

## 6. Build and migrate

```bash
cd /var/www/rsm-e-invoicing
npm ci
npx prisma migrate deploy
npm run build
```

---

## 7. Firewall

Allow SSH and nginx only. Do **not** expose port 3000 publicly.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 8. PM2

```bash
cd /var/www/rsm-e-invoicing
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints (it enables the systemd unit).

Useful commands:

```bash
pm2 status
pm2 logs rsm-e-invoicing
pm2 restart rsm-e-invoicing
```

The app listens on `127.0.0.1:3000`. Secrets stay in `.env`; Next.js loads that file automatically.

---

## 9. nginx

```bash
sudo cp /var/www/rsm-e-invoicing/deploy/nginx.conf.example /etc/nginx/sites-available/rsm-e-invoicing
sudo nano /etc/nginx/sites-available/rsm-e-invoicing   # replace YOUR_DOMAIN
sudo ln -s /etc/nginx/sites-available/rsm-e-invoicing /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

If Ubuntu still has the default site and it conflicts, disable it:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## 10. HTTPS

DNS must already point at this server.

```bash
sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

Certbot rewrites the server block for port 443 and sets up auto-renewal. Test:

```bash
sudo certbot renew --dry-run
```

---

## 11. Smoke test

1. Open `https://YOUR_DOMAIN`
2. Submit a test assessment — Postgres row, user email with PDF, internal email, Sheet1 row, S3 object
3. Submit a test consultation — Postgres row, confirmation email, admin email, Sheet2 row
4. Open `https://YOUR_DOMAIN/submissions` and confirm the shared password gate works, the assessment appears in the first tab, and the consultation appears in the second tab
4. If anything fails: `pm2 logs rsm-e-invoicing`

---

## 12. Later updates

Uses the same deploy key; no extra GitHub auth.

```bash
cd /var/www/rsm-e-invoicing
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart rsm-e-invoicing
```

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Prisma migration fails | `DATABASE_URL` points at the Docker Postgres container; `docker compose ps`; `docker compose logs postgres` |
| `/submissions` says unauthorized | `SUBMISSIONS_PASSWORD` is set in `.env`; clear cookies and sign in again |
| `Permission denied (publickey)` on clone/pull | Public key is a **Deploy key** on this repo; `IdentityFile` in `~/.ssh/config` matches the private key; `ssh -T git@github.com` |
| Sheets not updating | `GOOGLE_SHEETS_SPREADSHEET_ID` is set; service account has Editor access; `pm2 logs` |
| Emails not sending | SMTP vars, SES sandbox / verified identity, `FROM_EMAIL` |
| PDF / timeout errors | 2 GB RAM; nginx `proxy_read_timeout 60s` is in the site config |
| 502 Bad Gateway | `pm2 status` — app must be online on port 3000 |

### Site does not open on HTTP or the IP (before or after certbot)

Do **not** retry certbot until HTTP works. Certbot needs port 80 reachable from the internet.

On the VPS, in order:

```bash
pm2 status
curl -I http://127.0.0.1:3000
sudo systemctl status nginx --no-pager
sudo nginx -t
curl -I http://127.0.0.1
sudo ufw status
sudo ss -tlnp | grep -E ':80|:3000'
```

- If PM2 is empty: `cd /var/www/rsm-e-invoicing && pm2 start ecosystem.config.cjs`
- If `nginx -t` fails after a certbot error, restore HTTP-only config:

```bash
sudo cp /var/www/rsm-e-invoicing/deploy/nginx.conf.example /etc/nginx/sites-available/rsm-e-invoicing
sudo nano /etc/nginx/sites-available/rsm-e-invoicing   # real domain, not YOUR_DOMAIN
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/rsm-e-invoicing /etc/nginx/sites-enabled/rsm-e-invoicing
sudo nginx -t && sudo systemctl reload nginx
```

- In the browser use `http://YOUR_VPS_IP` (not `https://`).
- Also open **80** and **443** in the cloud provider firewall / security group (DigitalOcean, Hetzner, AWS, etc.). UFW is not enough if that panel still blocks inbound 80.

Only when `http://YOUR_VPS_IP` loads, run certbot. Use the domain that already has an A record; omit `-d www.YOUR_DOMAIN` if `www` is not in DNS yet.
