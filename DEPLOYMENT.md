# Deployment Guide - Hostinger

## Prerequisites
- Hostinger VPS/Cloud Hosting (Node.js support required)
- SSH access to your server
- Domain name pointing to your Hostinger IP
- Basic Linux command knowledge

---

## Step 1: Connect to Your Server via SSH

```bash
ssh root@your_server_ip
# Or with specific port (if given)
ssh -p 22 root@your_server_ip
```

---

## Step 2: Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js (v18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install npm
npm install -g npm@latest

# Install Git
apt install -y git

# Install PM2 (process manager)
npm install -g pm2

# Install Nginx (web server)
apt install -y nginx

# Install SQLite (for database)
apt install -y sqlite3
```

---

## Step 3: Clone & Setup Project

```bash
# Navigate to home directory
cd /home

# Clone your repository (if using Git)
git clone https://github.com/your-repo/crm-manufacturing.git
cd crm-manufacturing

# Or if uploading via FTP/SFTP:
# Upload your files to /home/crm-manufacturing
```

---

## Step 4: Setup Backend

```bash
cd /home/crm-manufacturing/backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=3001
DATABASE_URL=./data/crm.db
JWT_SECRET=your_secret_key_here_change_this
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
EOF

# Test if backend starts
node index.js

# If it works, press Ctrl+C to stop
```

---

## Step 5: Setup Frontend (Build)

```bash
cd /home/crm-manufacturing/frontend

# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with optimized files
```

---

## Step 6: Configure Nginx (Reverse Proxy)

```bash
# Edit Nginx config
nano /etc/nginx/sites-available/default
```

Replace the entire file with:

```nginx
upstream backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (configure after)
    ssl_certificate /etc/ssl/certs/your_cert.crt;
    ssl_certificate_key /etc/ssl/private/your_key.key;

    # Serve frontend
    location / {
        root /home/crm-manufacturing/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads {
        alias /home/crm-manufacturing/backend/uploads;
        expires 30d;
    }
}
```

Save: `Ctrl+X` → `Y` → `Enter`

Test Nginx:
```bash
nginx -t

# If "successful", reload:
systemctl reload nginx
```

---

## Step 7: Start Backend with PM2

```bash
cd /home/crm-manufacturing/backend

# Start backend
pm2 start index.js --name "crm-backend"

# Make it restart on server reboot
pm2 startup
pm2 save

# View logs
pm2 logs crm-backend
```

---

## Step 8: SSL Certificate (HTTPS)

Use Let's Encrypt (Free):

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Generate certificate
certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Update Nginx config with certificate paths
# Then reload Nginx
systemctl reload nginx
```

---

## Step 9: Verify Everything

1. **Check Backend Running:**
   ```bash
   pm2 status
   ```

2. **Check Nginx Running:**
   ```bash
   systemctl status nginx
   ```

3. **Check Ports:**
   ```bash
   netstat -tlnp | grep -E ':(80|443|3001)'
   ```

4. **Access your site:**
   - `https://yourdomain.com` (Frontend)
   - `https://yourdomain.com/api/health` (Backend check)

---

## Troubleshooting

**Backend not starting:**
```bash
cd /home/crm-manufacturing/backend
pm2 logs crm-backend
```

**Nginx not loading:**
```bash
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

**Database permission error:**
```bash
chmod -R 755 /home/crm-manufacturing/backend/data
```

---

## Maintenance

**View logs:**
```bash
pm2 logs crm-backend
```

**Restart backend:**
```bash
pm2 restart crm-backend
```

**Update code:**
```bash
cd /home/crm-manufacturing
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart crm-backend
```

---

## Security Best Practices

1. ✅ Change JWT_SECRET in .env
2. ✅ Use HTTPS only
3. ✅ Keep Node.js updated
4. ✅ Set proper file permissions
5. ✅ Enable Nginx security headers

Add to Nginx config:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

---

## Need Help?

- Backend logs: `pm2 logs crm-backend`
- Nginx logs: `tail -f /var/log/nginx/error.log`
- Database check: `sqlite3 data/crm.db "SELECT COUNT(*) FROM users;"`
