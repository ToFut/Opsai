# API Documentation

## Endpoints


### Users

- `GET /api/users` - List all users
- `GET /api/users/:id` - Get users by ID
- `POST /api/users` - Create new users
- `PUT /api/users/:id` - Update users
- `DELETE /api/users/:id` - Delete users

### Organizations

- `GET /api/organizations` - List all organizations
- `GET /api/organizations/:id` - Get organizations by ID
- `POST /api/organizations` - Create new organizations
- `PUT /api/organizations/:id` - Update organizations
- `DELETE /api/organizations/:id` - Delete organizations

### Projects

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get projects by ID
- `POST /api/projects` - Create new projects
- `PUT /api/projects/:id` - Update projects
- `DELETE /api/projects/:id` - Delete projects

### Tasks

- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get tasks by ID
- `POST /api/tasks` - Create new tasks
- `PUT /api/tasks/:id` - Update tasks
- `DELETE /api/tasks/:id` - Delete tasks


## Authentication

Authentication is enabled. Include JWT token in Authorization header.

## Environment Variables

See `.env.example` for required environment variables.