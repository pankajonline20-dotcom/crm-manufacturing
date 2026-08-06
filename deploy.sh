#!/bin/bash

# CEO CRM Deployment Script for Hostinger
# Run: bash deploy.sh

echo "🚀 CEO CRM Deployment Script"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_PATH="/home/crm-manufacturing"
DOMAIN="yourdomain.com"
EMAIL="your-email@yourdomain.com"

# Prompt for configuration
read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
read -p "Enter your email (for SSL): " EMAIL
read -p "Enter JWT secret (or press Enter for random): " JWT_SECRET

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
fi

echo -e "${YELLOW}Installing dependencies...${NC}"

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install tools
sudo npm install -g npm@latest pm2
sudo apt install -y git nginx sqlite3 certbot python3-certbot-nginx

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Backend setup
echo -e "${YELLOW}Setting up backend...${NC}"
cd $PROJECT_PATH/backend
npm install

cat > .env << EOF
PORT=3001
DATABASE_URL=./data/crm.db
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
FRONTEND_URL=https://$DOMAIN
EOF

echo -e "${GREEN}✓ Backend configured${NC}"

# Frontend build
echo -e "${YELLOW}Building frontend...${NC}"
cd $PROJECT_PATH/frontend
npm install
npm run build

echo -e "${GREEN}✓ Frontend built${NC}"

# Start backend with PM2
echo -e "${YELLOW}Starting backend with PM2...${NC}"
cd $PROJECT_PATH/backend
pm2 start index.js --name "crm-backend"
pm2 startup
pm2 save

echo -e "${GREEN}✓ Backend started${NC}"

# Configure Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"

sudo tee /etc/nginx/sites-available/crm > /dev/null <<EOF
upstream backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        root $PROJECT_PATH/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        alias $PROJECT_PATH/backend/uploads;
        expires 30d;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx
sudo nginx -t

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ Nginx configured${NC}"
else
    echo -e "${RED}✗ Nginx configuration failed${NC}"
    exit 1
fi

# SSL Certificate
echo -e "${YELLOW}Installing SSL certificate...${NC}"
sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo -e "${GREEN}✓ SSL certificate installed${NC}"
else
    echo -e "${RED}✗ SSL installation failed (will retry manually)${NC}"
fi

# Verify
echo -e "${YELLOW}Verifying installation...${NC}"

echo -e "${GREEN}✓ Backend status:${NC}"
pm2 status

echo -e "${GREEN}✓ Nginx status:${NC}"
sudo systemctl status nginx --no-pager

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "📍 Access your CRM:"
echo "   🌐 https://$DOMAIN"
echo "   🔌 Backend API: https://$DOMAIN/api/health"
echo ""
echo "📝 Backend logs:"
echo "   pm2 logs crm-backend"
echo ""
echo "🔄 Restart backend:"
echo "   pm2 restart crm-backend"
echo ""
