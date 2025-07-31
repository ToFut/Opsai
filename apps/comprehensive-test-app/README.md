# Comprehensive Test Platform

Full-featured B2B SaaS platform testing all OPSAI generator capabilities

## Features

- Authentication
- File Upload
- Notifications
- Analytics
- Workflows
- Alerts
- Integrations
- Audit
- Search
- Caching

## Entities

- **Users**: Application users with authentication
- **Organizations**: Customer organizations
- **Projects**: Organization projects
- **Tasks**: Project tasks

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

The API will be available at `http://localhost:3001`

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run type:check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run db:studio` - Open Prisma Studio

## Generated with CORE Platform

This application was generated using the CORE Platform CLI.
Learn more at [github.com/opsai/core-platform](https://github.com/opsai/core-platform)

## License

MIT