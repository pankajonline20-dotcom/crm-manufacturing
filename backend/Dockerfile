FROM node:18-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app/backend

COPY package*.json ./
RUN npm install --production

COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/backend/data

ENV NODE_ENV=production
ENV DATABASE_URL=./data/crm.db

EXPOSE 3001

CMD ["npm", "start"]
