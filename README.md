# Instagram Profile Scraper

This project allows you to extract information from Instagram profiles, storing data such as posts, comments, followers, and more in a PostgreSQL database using Prisma. It is built with TypeScript, Express, and Bun for fast and efficient development.

## Main Features

- Scraping of Instagram profiles and posts
- Structured storage with Prisma ORM
- RESTful API with Express
- Ready-to-use configuration for development and production (including Docker)
- Integrated linter (ESLint) and code formatter (Prettier)

## Prerequisites

- [Bun](https://bun.sh/) installed
- [Node.js](https://nodejs.org/) (optional, only if you use additional tools)
- [Docker](https://www.docker.com/) (optional, for container deployment)
- PostgreSQL database (local or remote)

## Basic Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd insta-scraper
```

### 2. Install dependencies

```bash
bun install
```

### 3. Set up environment variables

Create a `.env` file in the project root with your PostgreSQL `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@host:port/db_name
```

### 4. Run migrations and generate Prisma client

```bash
bunx prisma migrate deploy
bunx prisma generate
```

### 5. Start the development server

```bash
bun run dev
```

## Using Docker

### 1. Build the image

```bash
docker build -t insta-scraper .
```

### 2. Run the container

```bash
docker run --env-file .env -p 4000:4000 insta-scraper
```

Or using Docker Compose (if you prefer):

```bash
docker-compose up --build
```

## Useful Scripts

- `bun run dev` — Start the server with hot reload
- `bun run lint` — Run ESLint
- `bun run format` — Format code with Prettier

---