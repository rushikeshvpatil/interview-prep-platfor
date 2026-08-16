# Self-Hosted Judge0 CE Deployment Guide (AWS EC2 / VPS)

This directory contains the production-ready Docker Compose stack to run a self-hosted **Judge0 Community Edition** instance on your own infrastructure (such as an AWS EC2 instance or Ubuntu VPS).

---

## 1. Recommended EC2 Instance Requirements

- **Instance Type**: `t3.small` (minimum for testing) or `t3.medium` / `c6i.large` (recommended for multi-language compilation).
- **Operating System**: Ubuntu 22.04 LTS x86_64.
- **Storage**: 25 GB+ gp3 EBS volume.
- **Security Group**:
  - Inbound: Port 22 (SSH from your IP), Port 80 / 443 (HTTP/HTTPS from Vercel / Cloudflare).
  - Outbound: All traffic (for package installation and Docker pulls).

---

## 2. Server Setup Instructions

### Step 1: Connect to your EC2 instance
```bash
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```

### Step 2: Install Docker and Docker Compose
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker

# Allow non-root docker (optional)
sudo usermod -aG docker ubuntu
```

### Step 3: Clone or copy the `judge0/` directory to the server
```bash
mkdir -p ~/judge0
cd ~/judge0

# Copy docker-compose.yml and judge0.conf into ~/judge0/
```

### Step 4: Configure environment and security
Edit `judge0.conf` or set your desired secret auth token:
```bash
# Generate a random secret token
AUTH_TOKEN=$(openssl rand -hex 16)
echo "JUDGE0_AUTH_TOKEN=$AUTH_TOKEN" >> .env
```

### Step 5: Start the Judge0 stack
```bash
docker-compose up -d
```

### Step 6: Verify Judge0 health
```bash
curl -i -X GET http://localhost:2358/about
```
You should receive a `200 OK` response with Judge0 version information.

---

## 3. Nginx Reverse Proxy & SSL (Recommended)

To securely expose Judge0 over HTTPS with your domain name (e.g. `https://judge.yourdomain.com`):

```nginx
server {
    server_name judge.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:2358;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
}
```

Use `certbot --nginx -d judge.yourdomain.com` for automatic Let's Encrypt SSL certificates.

---

## 4. Connecting Vercel Application to Judge0

In your Vercel Project Settings (or local `.env.local` for development):

```env
# URL to your Judge0 server (e.g. http://localhost:2358 for local testing, or https://judge.yourdomain.com)
JUDGE0_API_URL="https://judge.yourdomain.com"

# Shared secret token configured in judge0.conf
JUDGE0_AUTH_TOKEN="your_generated_secret_token"
```

---

## 5. Security & Sandboxing Features

1. **Execution Isolation**: Code runs inside Linux `isolate` cgroup sandboxes with strict CPU, memory, and process count caps.
2. **Network Disabled**: `ENABLE_NETWORK=false` in `judge0.conf` completely blocks user-submitted code from accessing the internet or EC2 metadata.
3. **No Direct Browser Access**: Next.js API routes act as an authenticated gateway. The Judge0 endpoint and token are never exposed to browser clients.
