# Docker Setup for Welfare Project

This project uses Docker Compose to set up a complete development environment with PostgreSQL database.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Development Environment

1. **Start the development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Run database migrations:**
   ```bash
   docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev
   ```

3. **Access the application:**
   - Application: http://localhost:3000
   - Database: localhost:5432

### Production Environment

1. **Build and start production environment:**
   ```bash
   docker-compose up -d
   ```

2. **Run database migrations:**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   ```

3. **Access Prisma Studio (optional):**
   ```bash
   docker-compose --profile studio up prisma-studio
   ```
   - Prisma Studio: http://localhost:5555

## Available Commands

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Access app container shell
docker-compose -f docker-compose.dev.yml exec app sh

# Run Prisma commands
docker-compose -f docker-compose.dev.yml exec app npx prisma generate
docker-compose -f docker-compose.dev.yml exec app npx prisma migrate dev
docker-compose -f docker-compose.dev.yml exec app npx prisma db push
```

### Production
```bash
# Start production environment
docker-compose up -d

# Stop production environment
docker-compose down

# View logs
docker-compose logs -f app

# Access app container shell
docker-compose exec app sh
```

## Database Access

### Connection Details
- **Host:** localhost (from host machine) or postgres (from within Docker network)
- **Port:** 5432
- **Database:** welfare_db
- **Username:** welfare_user
- **Password:** welfare_password

### Direct Database Access
```bash
# Connect to PostgreSQL directly
docker-compose exec postgres psql -U welfare_user -d welfare_db
```

## Environment Variables

The application uses the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)

## Volumes

- `postgres_data`: Persistent PostgreSQL data (production)
- `postgres_dev_data`: Persistent PostgreSQL data (development)

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - If port 3000 or 5432 is already in use, modify the ports in the docker-compose files

2. **Database connection issues:**
   - Ensure PostgreSQL is healthy: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`

3. **Prisma issues:**
   - Regenerate client: `docker-compose exec app npx prisma generate`
   - Reset database: `docker-compose exec app npx prisma migrate reset`

### Cleanup

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove development containers and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove Docker images
docker rmi welfare-project_app
```

## Development Workflow

1. Start the development environment
2. Make changes to your code (auto-reload enabled)
3. Run migrations when schema changes
4. Use Prisma Studio for database management
5. Test your changes
6. Commit and deploy
