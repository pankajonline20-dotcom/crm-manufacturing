FROM node:18-alpine

WORKDIR /app/backend

COPY package*.json ./
RUN npm install

COPY . .

# Create data directory for SQLite
RUN mkdir -p /app/backend/data

ENV NODE_ENV=production
ENV DATABASE_URL=./data/crm.db

EXPOSE 3001

CMD ["npm", "start"]
