FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma Client with dummy DATABASE_URL for build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npx prisma generate

EXPOSE 3005

# Run migrations and start dev server (real DATABASE_URL from docker-compose)
CMD npx prisma migrate deploy && echo "Migrations complete, starting service..." && npm run dev
