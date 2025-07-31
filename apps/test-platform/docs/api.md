# API Documentation

## Endpoints


### Users

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get users by ID
- `POST /api/users` - Create new users
- `PUT /api/users/:id` - Update users
- `DELETE /api/users/:id` - Delete users

### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get projects by ID
- `POST /api/projects` - Create new projects
- `PUT /api/projects/:id` - Update projects
- `DELETE /api/projects/:id` - Delete projects


## Authentication

Authentication is enabled. Include JWT token in Authorization header.

## Environment Variables

See `.env.example` for required environment variables.