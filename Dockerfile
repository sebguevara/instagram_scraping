# Official Bun image
FROM oven/bun:1.1.42

# Set working directory
WORKDIR /app

# Copy dependencies first to leverage cache
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Generate Prisma client (if using Prisma)
RUN bunx prisma generate

# Expose port (adjust if using another)
EXPOSE 4200

# Command to start the app
CMD ["bun", "start"]