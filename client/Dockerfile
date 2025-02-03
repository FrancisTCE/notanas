# Use the official Node.js image
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js app
RUN npm run build

# Use a lightweight Node.js image for production
FROM node:18-alpine AS runner
WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# Install production dependencies
RUN npm install --only=production

# Expose port 3000
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
