# My Crm System

Customer Relationship Management system with lead tracking and sales pipeline - Generated for my-crm-system

## Features

- Authentication
- Multi Tenancy
- Notifications
- Analytics

## Entities

- **Contacts**: Customer and prospect contacts
- **Deals**: Sales opportunities and deals

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


### Contacts

- `GET /api/contacts` - List all contacts
- `GET /api/contacts/:id` - Get contacts by ID
- `POST /api/contacts` - Create new contacts
- `PUT /api/contacts/:id` - Update contacts
- `DELETE /api/contacts/:id` - Delete contacts

### Deals

- `GET /api/deals` - List all deals
- `GET /api/deals/:id` - Get deals by ID
- `POST /api/deals` - Create new deals
- `PUT /api/deals/:id` - Update deals
- `DELETE /api/deals/:id` - Delete deals


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