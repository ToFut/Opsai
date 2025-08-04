"""
Code Generation and Analysis Tools
Used by Code Generator Agent
"""

from typing import Dict, Any, List
import ast
import json

class ComponentGeneratorTool:
    """Generate React/Vue/Angular components"""
    
    def generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a component based on parameters"""
        name = params.get("name", "Component")
        framework = params.get("framework", "react")
        props = params.get("props", [])
        state = params.get("state", [])
        hooks = params.get("hooks", [])
        
        if framework == "react":
            return self._generate_react_component(name, props, state, hooks)
        elif framework == "vue":
            return self._generate_vue_component(name, props, state)
        elif framework == "angular":
            return self._generate_angular_component(name, props)
        else:
            return {"error": f"Unsupported framework: {framework}"}
    
    def _generate_react_component(self, name: str, props: List[Dict], state: List[Dict], hooks: List[str]) -> Dict[str, Any]:
        """Generate a React component"""
        # Generate TypeScript interface for props
        props_interface = ""
        if props:
            props_interface = f"""
interface {name}Props {{
{chr(10).join(f'  {prop["name"]}: {prop.get("type", "any")};' for prop in props)}
}}
"""
        
        # Generate state hooks
        state_hooks = []
        for s in state:
            state_hooks.append(
                f'  const [{s["name"]}, set{s["name"].capitalize()}] = useState<{s.get("type", "any")}>({s.get("initial", "null")});'
            )
        
        # Generate component code
        code = f"""import React{', { useState' + ', '.join(hooks) + ' }' if state or hooks else ''} from 'react';
import './styles.css';
{props_interface}

export default function {name}({'{' + ', '.join(prop["name"] for prop in props) + ' }: ' + name + 'Props' if props else ''}) {{
{chr(10).join(state_hooks)}

  return (
    <div className="{name.lower()}-container">
      <h2>{name}</h2>
      {/* Add your component content here */}
    </div>
  );
}}"""
        
        # Generate CSS
        css = f""".{name.lower()}-container {{
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 1rem 0;
}}

.{name.lower()}-container h2 {{
  margin: 0 0 1rem 0;
  color: #333;
}}"""
        
        return {
            "code": code,
            "css": css,
            "instructions": [
                f"Created {name} component with TypeScript",
                "Remember to import and use the component in your app",
                "Customize the styling in the CSS file as needed"
            ],
            "dependencies": ["react", "@types/react"]
        }
    
    def _generate_vue_component(self, name: str, props: List[Dict], state: List[Dict]) -> Dict[str, Any]:
        """Generate a Vue component"""
        # Vue 3 Composition API template
        props_definition = ""
        if props:
            props_definition = f"""
  props: {{
{chr(10).join(f'    {prop["name"]}: {{ type: {prop.get("type", "String")}, required: {prop.get("required", "false")} }},' for prop in props)}
  }},"""
        
        code = f"""<template>
  <div class="{name.lower()}-container">
    <h2>{name}</h2>
    <!-- Add your component content here -->
  </div>
</template>

<script setup lang="ts">
import {{ ref, computed }} from 'vue';

{f'interface Props {{ {chr(10).join(f"{prop['name']}: {prop.get('type', 'any')}" for prop in props)} }}' if props else ''}
{f'const props = defineProps<Props>();' if props else ''}

{chr(10).join(f"const {s['name']} = ref<{s.get('type', 'any')}>({s.get('initial', 'null')});" for s in state)}

// Add component logic here
</script>

<style scoped>
.{name.lower()}-container {{
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin: 1rem 0;
}}

.{name.lower()}-container h2 {{
  margin: 0 0 1rem 0;
  color: #333;
}}
</style>"""
        
        return {
            "code": code,
            "instructions": [
                f"Created {name} Vue 3 component with Composition API",
                "Import and register the component to use it",
                "Supports TypeScript with <script setup lang='ts'>"
            ],
            "dependencies": ["vue", "@vue/runtime-core"]
        }
    
    def _generate_angular_component(self, name: str, props: List[Dict]) -> Dict[str, Any]:
        """Generate an Angular component"""
        # Angular component with TypeScript
        inputs = "\n".join(f"  @Input() {prop['name']}: {prop.get('type', 'any')};' for prop in props)
        
        code = f"""import {{ Component, Input, OnInit }} from '@angular/core';

@Component({{
  selector: 'app-{name.lower()}',
  templateUrl: './{name.lower()}.component.html',
  styleUrls: ['./{name.lower()}.component.css']
}})
export class {name}Component implements OnInit {{
{inputs}

  constructor() {{ }}

  ngOnInit(): void {{
    // Component initialization logic
  }}
}}"""
        
        template = f"""<div class="{name.lower()}-container">
  <h2>{name}</h2>
  <!-- Add your component content here -->
</div>"""
        
        return {
            "code": code,
            "template": template,
            "instructions": [
                f"Created {name} Angular component",
                f"Add to module declarations to use",
                "Implements OnInit lifecycle hook"
            ],
            "dependencies": ["@angular/core", "@angular/common"]
        }

class APIGeneratorTool:
    """Generate API endpoints"""
    
    def generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate API endpoint code"""
        endpoint = params.get("endpoint", "resource")
        method = params.get("method", "GET")
        framework = params.get("framework", "express")
        auth = params.get("auth", False)
        validation = params.get("validation", True)
        
        if framework == "express":
            return self._generate_express_endpoint(endpoint, method, auth, validation)
        elif framework == "fastapi":
            return self._generate_fastapi_endpoint(endpoint, method, auth, validation)
        else:
            return {"error": f"Unsupported framework: {framework}"}
    
    def _generate_express_endpoint(self, endpoint: str, method: str, auth: bool, validation: bool) -> Dict[str, Any]:
        """Generate Express.js endpoint"""
        auth_middleware = "requireAuth, " if auth else ""
        
        code = f"""import {{ Router, Request, Response }} from 'express';
import {{ body, validationResult }} from 'express-validator';
{f"import {{ requireAuth }} from '../middleware/auth';" if auth else ""}

const router = Router();

{self._generate_express_method(endpoint, method, auth_middleware, validation)}

export default router;"""
        
        return {
            "code": code,
            "instructions": [
                f"Created {method} endpoint for /{endpoint}",
                f"Authentication: {'Required' if auth else 'Not required'}",
                f"Validation: {'Enabled' if validation else 'Disabled'}"
            ],
            "dependencies": ["express", "express-validator", "@types/express"]
        }
    
    def _generate_express_method(self, endpoint: str, method: str, auth_middleware: str, validation: bool) -> str:
        """Generate specific HTTP method handler"""
        if method == "GET":
            return f"""// GET /{endpoint}
router.get('/{endpoint}', {auth_middleware}async (req: Request, res: Response) => {{
  try {{
    // Implement your logic here
    const data = await get{endpoint.capitalize()}();
    res.json({{ success: true, data }});
  }} catch (error) {{
    res.status(500).json({{ success: false, error: error.message }});
  }}
}});"""
        
        elif method == "POST":
            validators = """[
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
], """ if validation else ""
            
            return f"""// POST /{endpoint}
router.post('/{endpoint}', {auth_middleware}{validators}async (req: Request, res: Response) => {{
  {f'''// Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {{
    return res.status(400).json({{ errors: errors.array() }});
  }}''' if validation else ''}
  
  try {{
    const {{ name, email }} = req.body;
    // Implement your logic here
    const result = await create{endpoint.capitalize()}({{ name, email }});
    res.status(201).json({{ success: true, data: result }});
  }} catch (error) {{
    res.status(500).json({{ success: false, error: error.message }});
  }}
}});"""
        
        elif method == "PUT":
            return f"""// PUT /{endpoint}/:id
router.put('/{endpoint}/:id', {auth_middleware}async (req: Request, res: Response) => {{
  try {{
    const {{ id }} = req.params;
    const updates = req.body;
    // Implement your logic here
    const result = await update{endpoint.capitalize()}(id, updates);
    res.json({{ success: true, data: result }});
  }} catch (error) {{
    res.status(500).json({{ success: false, error: error.message }});
  }}
}});"""
        
        elif method == "DELETE":
            return f"""// DELETE /{endpoint}/:id
router.delete('/{endpoint}/:id', {auth_middleware}async (req: Request, res: Response) => {{
  try {{
    const {{ id }} = req.params;
    // Implement your logic here
    await delete{endpoint.capitalize()}(id);
    res.json({{ success: true, message: 'Deleted successfully' }});
  }} catch (error) {{
    res.status(500).json({{ success: false, error: error.message }});
  }}
}});"""
        
        return ""
    
    def _generate_fastapi_endpoint(self, endpoint: str, method: str, auth: bool, validation: bool) -> Dict[str, Any]:
        """Generate FastAPI endpoint"""
        auth_dep = ", current_user: User = Depends(get_current_user)" if auth else ""
        
        code = f"""from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
{f"from ..auth import get_current_user, User" if auth else ""}

router = APIRouter()

class {endpoint.capitalize()}Create(BaseModel):
    name: str
    email: EmailStr
    description: Optional[str] = None

class {endpoint.capitalize()}Update(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None

class {endpoint.capitalize()}Response(BaseModel):
    id: int
    name: str
    email: str
    description: Optional[str]

@router.{method.lower()}("/{endpoint}")
async def {method.lower()}_{endpoint}({self._get_fastapi_params(method)}{auth_dep}):
    \"\"\"
    {method} {endpoint} endpoint
    \"\"\"
    try:
        # Implement your logic here
        result = await {method.lower()}_{endpoint}_handler({self._get_fastapi_args(method)})
        return {{"success": True, "data": result}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""
        
        return {
            "code": code,
            "instructions": [
                f"Created FastAPI {method} endpoint for /{endpoint}",
                "Includes Pydantic models for validation",
                f"Authentication: {'Required' if auth else 'Not required'}"
            ],
            "dependencies": ["fastapi", "pydantic", "python-multipart"]
        }
    
    def _get_fastapi_params(self, method: str) -> str:
        """Get parameters for FastAPI endpoint based on method"""
        if method == "POST":
            return "data: {}Create".format("Resource")
        elif method in ["PUT", "PATCH"]:
            return "id: int, data: {}Update".format("Resource")
        elif method == "DELETE":
            return "id: int"
        else:  # GET
            return "skip: int = 0, limit: int = 100"
    
    def _get_fastapi_args(self, method: str) -> str:
        """Get arguments to pass to handler"""
        if method == "POST":
            return "data"
        elif method in ["PUT", "PATCH"]:
            return "id, data"
        elif method == "DELETE":
            return "id"
        else:  # GET
            return "skip, limit"

class DatabaseSchemaTool:
    """Generate database schemas and migrations"""
    
    def generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate database schema"""
        entities = params.get("entities", [])
        database = params.get("database", "postgresql")
        orm = params.get("orm", "prisma")
        
        if orm == "prisma":
            return self._generate_prisma_schema(entities)
        elif orm == "sequelize":
            return self._generate_sequelize_models(entities)
        elif orm == "typeorm":
            return self._generate_typeorm_entities(entities)
        else:
            return {"error": f"Unsupported ORM: {orm}"}
    
    def _generate_prisma_schema(self, entities: List[Dict]) -> Dict[str, Any]:
        """Generate Prisma schema"""
        schema_parts = ["""datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
"""]
        
        for entity in entities:
            name = entity.get("name", "Entity")
            fields = entity.get("fields", [])
            
            model = f"""model {name} {{
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
"""
            
            for field in fields:
                field_def = f"  {field['name']} {self._prisma_type(field['type'])}"
                if field.get("optional"):
                    field_def += "?"
                if field.get("unique"):
                    field_def += " @unique"
                if field.get("default"):
                    field_def += f" @default({field['default']})"
                model += field_def + "\n"
            
            # Add relations
            relations = entity.get("relations", [])
            for rel in relations:
                if rel["type"] == "belongsTo":
                    model += f"  {rel['name']} {rel['model']} @relation(fields: [{rel['name']}Id], references: [id])\n"
                    model += f"  {rel['name']}Id Int\n"
                elif rel["type"] == "hasMany":
                    model += f"  {rel['name']} {rel['model']}[]\n"
            
            model += "}\n"
            schema_parts.append(model)
        
        return {
            "code": "\n".join(schema_parts),
            "instructions": [
                "Save as schema.prisma in your project root",
                "Run 'npx prisma generate' to generate client",
                "Run 'npx prisma migrate dev' to create migrations"
            ],
            "dependencies": ["@prisma/client", "prisma"]
        }
    
    def _prisma_type(self, type_str: str) -> str:
        """Convert generic type to Prisma type"""
        type_map = {
            "string": "String",
            "number": "Int",
            "float": "Float",
            "boolean": "Boolean",
            "date": "DateTime",
            "json": "Json",
            "text": "String @db.Text"
        }
        return type_map.get(type_str.lower(), "String")
    
    def _generate_sequelize_models(self, entities: List[Dict]) -> Dict[str, Any]:
        """Generate Sequelize models"""
        models = []
        
        for entity in entities:
            name = entity.get("name", "Entity")
            fields = entity.get("fields", [])
            
            model = f"""import {{ DataTypes, Model }} from 'sequelize';
import sequelize from '../config/database';

class {name} extends Model {{
  public id!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
"""
            
            # Add field declarations
            for field in fields:
                model += f"  public {field['name']}!: {self._ts_type(field['type'])};\n"
            
            model += f"""}}

{name}.init({{
"""
            
            # Add field definitions
            for field in fields:
                field_def = f"""  {field['name']}: {{
    type: DataTypes.{self._sequelize_type(field['type'])},
    allowNull: {str(field.get('optional', False)).lower()},"""
                
                if field.get('unique'):
                    field_def += "\n    unique: true,"
                if field.get('default'):
                    field_def += f"\n    defaultValue: {field['default']},"
                
                field_def = field_def.rstrip(',') + "\n  },"
                model += field_def + "\n"
            
            model = model.rstrip(',\n') + f"""
}}, {{
  sequelize,
  modelName: '{name}',
  tableName: '{name.lower()}s'
}});

export default {name};"""
            
            models.append(model)
        
        return {
            "code": "\n\n".join(models),
            "instructions": [
                "Save each model in separate files in models/ directory",
                "Import and sync models in your database config",
                "Run migrations to create tables"
            ],
            "dependencies": ["sequelize", "@types/sequelize"]
        }
    
    def _sequelize_type(self, type_str: str) -> str:
        """Convert generic type to Sequelize DataType"""
        type_map = {
            "string": "STRING",
            "number": "INTEGER",
            "float": "FLOAT",
            "boolean": "BOOLEAN",
            "date": "DATE",
            "json": "JSON",
            "text": "TEXT"
        }
        return type_map.get(type_str.lower(), "STRING")
    
    def _ts_type(self, type_str: str) -> str:
        """Convert generic type to TypeScript type"""
        type_map = {
            "string": "string",
            "number": "number",
            "float": "number",
            "boolean": "boolean",
            "date": "Date",
            "json": "any",
            "text": "string"
        }
        return type_map.get(type_str.lower(), "any")
    
    def _generate_typeorm_entities(self, entities: List[Dict]) -> Dict[str, Any]:
        """Generate TypeORM entities"""
        entity_files = []
        
        for entity in entities:
            name = entity.get("name", "Entity")
            fields = entity.get("fields", [])
            
            code = f"""import {{ Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn }} from 'typeorm';

@Entity()
export class {name} {{
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
"""
            
            for field in fields:
                column_options = []
                if field.get('unique'):
                    column_options.append("unique: true")
                if field.get('optional'):
                    column_options.append("nullable: true")
                if field.get('default'):
                    column_options.append(f"default: {field['default']}")
                
                options_str = f"{{ {', '.join(column_options)} }}" if column_options else ""
                
                code += f"""
  @Column({options_str})
  {field['name']}: {self._ts_type(field['type'])};
"""
            
            code += "}"
            entity_files.append(code)
        
        return {
            "code": "\n\n".join(entity_files),
            "instructions": [
                "Save each entity in entities/ directory",
                "Register entities in TypeORM config",
                "Run migrations to sync database"
            ],
            "dependencies": ["typeorm", "reflect-metadata"]
        }

class TestGeneratorTool:
    """Generate unit and integration tests"""
    
    def generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate test code"""
        component = params.get("component", "Component")
        test_type = params.get("type", "unit")
        framework = params.get("framework", "jest")
        
        if framework == "jest":
            if test_type == "unit":
                return self._generate_jest_unit_test(component)
            else:
                return self._generate_jest_integration_test(component)
        elif framework == "mocha":
            return self._generate_mocha_test(component, test_type)
        else:
            return {"error": f"Unsupported test framework: {framework}"}
    
    def _generate_jest_unit_test(self, component: str) -> Dict[str, Any]:
        """Generate Jest unit test"""
        code = f"""import React from 'react';
import {{ render, screen, fireEvent }} from '@testing-library/react';
import '@testing-library/jest-dom';
import {component} from './{component}';

describe('{component}', () => {{
  it('renders without crashing', () => {{
    render(<{component} />);
    expect(screen.getByText('{component}')).toBeInTheDocument();
  }});

  it('displays correct props', () => {{
    const testProps = {{
      title: 'Test Title',
      value: 42
    }};
    
    render(<{component} {{...testProps}} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  }});

  it('handles click events', () => {{
    const handleClick = jest.fn();
    render(<{component} onClick={{handleClick}} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  }});

  it('updates state correctly', () => {{
    render(<{component} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, {{ target: {{ value: 'New Value' }} }});
    
    expect(input.value).toBe('New Value');
  }});
}});"""
        
        return {
            "code": code,
            "instructions": [
                f"Created unit tests for {component}",
                "Run with 'npm test' or 'jest'",
                "Add more test cases as needed"
            ],
            "dependencies": [
                "@testing-library/react",
                "@testing-library/jest-dom",
                "@testing-library/user-event",
                "jest",
                "@types/jest"
            ]
        }
    
    def _generate_jest_integration_test(self, component: str) -> Dict[str, Any]:
        """Generate Jest integration test"""
        code = f"""import React from 'react';
import {{ render, screen, waitFor }} from '@testing-library/react';
import {{ rest }} from 'msw';
import {{ setupServer }} from 'msw/node';
import {component} from './{component}';

// Mock API server
const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {{
    return res(ctx.json({{ 
      success: true, 
      data: [{{ id: 1, name: 'Test Item' }}] 
    }}));
  }}),
  
  rest.post('/api/data', (req, res, ctx) => {{
    return res(ctx.json({{ 
      success: true, 
      data: {{ id: 2, ...req.body }} 
    }}));
  }})
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('{component} Integration Tests', () => {{
  it('fetches and displays data', async () => {{
    render(<{component} />);
    
    // Wait for data to load
    await waitFor(() => {{
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    }});
  }});

  it('submits form data correctly', async () => {{
    render(<{component} />);
    
    // Fill form
    const input = screen.getByLabelText('Name');
    fireEvent.change(input, {{ target: {{ value: 'New Item' }} }});
    
    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    // Wait for success message
    await waitFor(() => {{
      expect(screen.getByText('Item created successfully')).toBeInTheDocument();
    }});
  }});

  it('handles API errors gracefully', async () => {{
    // Override handler to return error
    server.use(
      rest.get('/api/data', (req, res, ctx) => {{
        return res(ctx.status(500), ctx.json({{ error: 'Server error' }}));
      }})
    );
    
    render(<{component} />);
    
    await waitFor(() => {{
      expect(screen.getByText('Error loading data')).toBeInTheDocument();
    }});
  }});
}});"""
        
        return {
            "code": code,
            "instructions": [
                f"Created integration tests for {component}",
                "Uses MSW for API mocking",
                "Tests data fetching and form submission"
            ],
            "dependencies": [
                "@testing-library/react",
                "msw",
                "jest",
                "@types/jest"
            ]
        }
    
    def _generate_mocha_test(self, component: str, test_type: str) -> Dict[str, Any]:
        """Generate Mocha test"""
        code = f"""import {{ expect }} from 'chai';
import sinon from 'sinon';
import {{ {component} }} from '../{component}';

describe('{component}', () => {{
  let sandbox;

  beforeEach(() => {{
    sandbox = sinon.createSandbox();
  }});

  afterEach(() => {{
    sandbox.restore();
  }});

  it('should initialize correctly', () => {{
    const instance = new {component}();
    expect(instance).to.exist;
    expect(instance.isReady).to.be.true;
  }});

  it('should handle method calls', async () => {{
    const instance = new {component}();
    const result = await instance.process({{ data: 'test' }});
    
    expect(result).to.deep.equal({{
      success: true,
      processed: 'test'
    }});
  }});

  it('should emit events', (done) => {{
    const instance = new {component}();
    const spy = sandbox.spy();
    
    instance.on('complete', spy);
    instance.start();
    
    setTimeout(() => {{
      expect(spy.calledOnce).to.be.true;
      done();
    }}, 100);
  }});

  {f"""it('should integrate with external services', async () => {{
    const apiStub = sandbox.stub(api, 'fetch').resolves({{ data: 'mocked' }});
    
    const instance = new {component}();
    const result = await instance.fetchData();
    
    expect(apiStub.calledOnce).to.be.true;
    expect(result).to.equal('mocked');
  }});""" if test_type == "integration" else ""}
}});"""
        
        return {
            "code": code,
            "instructions": [
                f"Created {test_type} tests for {component} using Mocha",
                "Run with 'npm test' or 'mocha'",
                "Uses Chai for assertions and Sinon for mocking"
            ],
            "dependencies": ["mocha", "chai", "sinon", "@types/mocha", "@types/chai", "@types/sinon"]
        }

class DocumentationGeneratorTool:
    """Generate documentation for code"""
    
    def generate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate documentation"""
        doc_type = params.get("type", "api")
        project_name = params.get("project_name", "Project")
        components = params.get("components", [])
        
        if doc_type == "api":
            return self._generate_api_docs(project_name, components)
        elif doc_type == "component":
            return self._generate_component_docs(project_name, components)
        elif doc_type == "readme":
            return self._generate_readme(project_name, params)
        else:
            return {"error": f"Unsupported documentation type: {doc_type}"}
    
    def _generate_api_docs(self, project_name: str, endpoints: List[Dict]) -> Dict[str, Any]:
        """Generate API documentation"""
        doc = f"""# {project_name} API Documentation

## Base URL
```
https://api.{project_name.lower()}.com/v1
```

## Authentication
All API requests require authentication using Bearer tokens:
```
Authorization: Bearer YOUR_API_TOKEN
```

## Endpoints

"""
        
        for endpoint in endpoints:
            doc += f"""### {endpoint.get('method', 'GET')} {endpoint.get('path', '/resource')}
{endpoint.get('description', 'Endpoint description')}

**Parameters:**
"""
            
            params = endpoint.get('parameters', [])
            if params:
                doc += "| Name | Type | Required | Description |\n"
                doc += "|------|------|----------|-------------|\n"
                for param in params:
                    doc += f"| {param['name']} | {param['type']} | {param.get('required', False)} | {param.get('description', '')} |\n"
            else:
                doc += "None\n"
            
            doc += f"""
**Request Body:**
```json
{json.dumps(endpoint.get('request_body', {}), indent=2)}
```

**Response:**
```json
{json.dumps(endpoint.get('response', {"success": True, "data": {}}), indent=2)}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

"""
        
        return {
            "code": doc,
            "instructions": [
                "Save as API.md in your docs directory",
                "Update with actual endpoints and examples",
                "Consider using tools like Swagger for interactive docs"
            ]
        }
    
    def _generate_component_docs(self, project_name: str, components: List[Dict]) -> Dict[str, Any]:
        """Generate component documentation"""
        doc = f"""# {project_name} Component Documentation

## Components Overview

"""
        
        for comp in components:
            name = comp.get('name', 'Component')
            doc += f"""### {name}
{comp.get('description', 'Component description')}

**Import:**
```javascript
import {name} from '@/components/{name}';
```

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
"""
            
            props = comp.get('props', [])
            for prop in props:
                doc += f"| {prop['name']} | `{prop['type']}` | {prop.get('default', 'undefined')} | {prop.get('description', '')} |\n"
            
            doc += f"""
**Usage Example:**
```jsx
<{name}
{chr(10).join(f'  {prop["name"]}={{{self._get_prop_example(prop)}}}' for prop in props[:3])}
/>
```

**Events:**
"""
            
            events = comp.get('events', [])
            if events:
                for event in events:
                    doc += f"- `{event['name']}` - {event.get('description', 'Event description')}\n"
            else:
                doc += "None\n"
            
            doc += "\n---\n\n"
        
        return {
            "code": doc,
            "instructions": [
                "Save as COMPONENTS.md in your docs directory",
                "Add more examples and use cases",
                "Consider using Storybook for interactive component docs"
            ]
        }
    
    def _get_prop_example(self, prop: Dict) -> str:
        """Get example value for prop"""
        type_examples = {
            "string": '"Example"',
            "number": "42",
            "boolean": "true",
            "function": "() => console.log('clicked')",
            "array": "[1, 2, 3]",
            "object": "{ key: 'value' }"
        }
        return type_examples.get(prop['type'].lower(), '"value"')
    
    def _generate_readme(self, project_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Generate README.md"""
        description = params.get('description', 'A modern web application')
        tech_stack = params.get('tech_stack', ['React', 'Node.js', 'PostgreSQL'])
        features = params.get('features', ['User authentication', 'Real-time updates', 'Responsive design'])
        
        readme = f"""# {project_name}

{description}

## 🚀 Features

{chr(10).join(f'- {feature}' for feature in features)}

## 🛠️ Tech Stack

{chr(10).join(f'- **{tech}**' for tech in tech_stack)}

## 📋 Prerequisites

- Node.js 16+
- npm or yarn
- PostgreSQL 13+
- Redis (optional, for caching)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/{project_name.lower()}.git
cd {project_name.lower()}
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
{project_name.lower()}/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── api/           # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── types/         # TypeScript types
├── public/            # Static assets
├── tests/            # Test files
├── docs/             # Documentation
└── package.json
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel
```bash
npm run deploy:vercel
```

### Docker
```bash
docker build -t {project_name.lower()} .
docker run -p 3000:3000 {project_name.lower()}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- Thanks to all contributors
- Inspired by best practices from the community
"""
        
        return {
            "code": readme,
            "instructions": [
                "Save as README.md in your project root",
                "Update with your actual project details",
                "Add screenshots and demo links"
            ]
        }

class CodeAnalysisTool:
    """Analyze code for improvements and issues"""
    
    def analyze(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze code and provide suggestions"""
        code = params.get("code", "")
        language = params.get("language", "javascript")
        
        issues = []
        suggestions = []
        
        # Basic analysis (in production, use proper AST parsing)
        lines = code.split('\n')
        
        # Check for common issues
        for i, line in enumerate(lines):
            # Long lines
            if len(line) > 100:
                issues.append({
                    "line": i + 1,
                    "type": "style",
                    "message": "Line too long (> 100 characters)"
                })
            
            # Console.log statements
            if 'console.log' in line and language in ['javascript', 'typescript']:
                issues.append({
                    "line": i + 1,
                    "type": "warning",
                    "message": "Remove console.log statements in production"
                })
            
            # TODO comments
            if 'TODO' in line or 'FIXME' in line:
                issues.append({
                    "line": i + 1,
                    "type": "info",
                    "message": "Unresolved TODO/FIXME comment"
                })
            
            # Hardcoded values
            if language in ['javascript', 'typescript']:
                if any(pattern in line for pattern in ['localhost:', 'http://', 'api_key =', 'password =']):
                    issues.append({
                        "line": i + 1,
                        "type": "security",
                        "message": "Possible hardcoded sensitive value"
                    })
        
        # Generate suggestions
        if 'function' in code and 'async' not in code:
            suggestions.append("Consider using async/await for asynchronous operations")
        
        if language in ['javascript', 'typescript'] and 'var ' in code:
            suggestions.append("Replace 'var' with 'const' or 'let' for better scoping")
        
        if 'catch' not in code and ('fetch' in code or 'axios' in code):
            suggestions.append("Add error handling for API calls")
        
        # Performance suggestions
        if '.map(' in code and '.filter(' in code:
            suggestions.append("Consider combining map and filter operations for better performance")
        
        return {
            "issues": issues,
            "suggestions": suggestions,
            "metrics": {
                "lines": len(lines),
                "complexity": self._calculate_complexity(code),
                "maintainability": 85  # Mock score
            }
        }
    
    def _calculate_complexity(self, code: str) -> int:
        """Calculate cyclomatic complexity (simplified)"""
        complexity = 1
        
        # Count decision points
        keywords = ['if', 'else', 'while', 'for', 'case', '&&', '||', '?']
        for keyword in keywords:
            complexity += code.count(keyword)
        
        return complexity