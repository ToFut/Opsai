# Line Properties

Vacation Rental Platform - Find your perfect getaway

## Features

- Authentication
- Multi Tenancy
- File Upload
- Notifications
- Analytics
- Workflows
- Alerts
- Integrations
- Search
- Booking
- Payments

## Entities

- **Properties**: Vacation rental properties
- **Reservations**: Property reservations
- **Guests**: Guest information

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

- `GET /api/Propertys` - List all properties
- `GET /api/Propertys/:id` - Get properties by ID
- `POST /api/Propertys` - Create new properties
- `PUT /api/Propertys/:id` - Update properties
- `DELETE /api/Propertys/:id` - Delete properties

### Reservations

- `GET /api/Reservations` - List all reservations
- `GET /api/Reservations/:id` - Get reservations by ID
- `POST /api/Reservations` - Create new reservations
- `PUT /api/Reservations/:id` - Update reservations
- `DELETE /api/Reservations/:id` - Delete reservations

### Guests

- `GET /api/Guests` - List all guests
- `GET /api/Guests/:id` - Get guests by ID
- `POST /api/Guests` - Create new guests
- `PUT /api/Guests/:id` - Update guests
- `DELETE /api/Guests/:id` - Delete guests


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