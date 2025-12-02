# Copilot Instructions for Welfare Project

## Project Overview
This is a **Next.js Admin Dashboard** project for welfare management, built with TypeScript and Prisma ORM.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Styling**: Tailwind CSS with PostCSS
- **Linting**: ESLint with Prettier
- **Containerization**: Docker & Docker Compose

## Code Style Guidelines

### TypeScript
- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use `async/await` over `.then()` chains

### Naming Conventions
- **Files**: Use kebab-case for file names (e.g., `user-profile.tsx`)
- **Components**: Use PascalCase (e.g., `UserProfile`)
- **Functions/Variables**: Use camelCase (e.g., `getUserData`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### React/Next.js
- Use functional components with hooks
- Prefer Server Components by default, use `'use client'` only when necessary
- Place API routes in `src/app/api/` directory
- Use Next.js Image component for optimized images

### Prisma
- Schema is located at `prisma/schema.prisma`
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` or `npx prisma migrate dev` for database sync

### File Structure

src/
├── app/ # Next.js App Router pages
├── components/ # Reusable React components
├── lib/ # Utility functions and configurations
├── hooks/ # Custom React hooks
├── types/ # TypeScript type definitions
└── styles/ # Global styles

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `docker-compose -f docker-compose.dev.yml up` - Run with Docker (development)

## Environment Variables
- Environment variables are stored in `.env` file
- Never commit sensitive data to version control
- Use `.env.example` as a template for required variables
