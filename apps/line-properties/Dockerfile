FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Generate Prisma client
RUN npm run db:generate

EXPOSE 3000

CMD ["npm", "start"]