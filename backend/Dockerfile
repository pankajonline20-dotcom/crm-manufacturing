FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/crm.db

EXPOSE 3001

CMD ["node", "index.js"]
