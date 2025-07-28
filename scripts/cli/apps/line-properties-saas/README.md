# Line Properties

Line Properties Vacation Rental Platform - Generated for line-properties

## Features

- Authentication
- Multi Tenancy
- Notifications
- Analytics
- File Upload
- Workflows
- Integrations

## Entities

- **Properties**: Vacation rental properties
- **Reservations**: Property reservations and bookings
- **Guests**: Guest information and profiles

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run db:setup
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints


### Properties

- `GET /api/propertys` - List all properties
- `GET /api/propertys/:id` - Get properties by ID
- `POST /api/propertys` - Create new properties
- `PUT /api/propertys/:id` - Update properties
- `DELETE /api/propertys/:id` - Delete properties

### Reservations

- `GET /api/reservations` - List all reservations
- `GET /api/reservations/:id` - Get reservations by ID
- `POST /api/reservations` - Create new reservations
- `PUT /api/reservations/:id` - Update reservations
- `DELETE /api/reservations/:id` - Delete reservations

### Guests

- `GET /api/guests` - List all guests
- `GET /api/guests/:id` - Get guests by ID
- `POST /api/guests` - Create new guests
- `PUT /api/guests/:id` - Update guests
- `DELETE /api/guests/:id` - Delete guests


## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run db:studio` - Open Prisma Studio

## Deployment

### Using Docker

```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set up production database and run migrations:
   ```bash
   npm run db:migrate
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Generated with CORE Platform

This application was generated using the CORE Platform CLI. 
Learn more at [github.com/opsai/core-platform](https://github.com/opsai/core-platform)

## License

MIT