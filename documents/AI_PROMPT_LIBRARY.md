# AI Prompt Library

## Database Design Prompts

### Prompt 1: Schema Generation
**Prompt**: 
```
Design a PostgreSQL database schema for a project management system with the following requirements:
- User authentication and role-based permissions (admin, manager, developer, qa)
- Project management with teams and milestones
- Task management with status tracking, priorities, and assignments
- Comment system for projects and tasks with mentions
- Time tracking and logging
- File attachments for projects and tasks
- Notification system for real-time updates
- Activity logging for audit trails

Include proper relationships, constraints, indexes, and consider scalability. Use UUID for primary keys and include soft deletes. Generate both the schema definition and Sequelize model associations.
```

**Context**: Initial database design phase, needed comprehensive schema for project management application
**Output Quality**: 9/10
**Iterations**: 2 refinements needed
- First iteration: Basic schema generated
- Second iteration: Added proper indexing and audit fields
**Final Result**: Complete normalized schema with 9 tables, proper relationships, and optimized indexes implemented successfully

### Prompt 2: Migration Scripts
**Prompt**:
```
Generate PostgreSQL migration scripts for the following tables in proper dependency order:
- Users (with authentication fields)
- Projects (with team management)
- Tasks (with project association and dependencies)
- Comments (polymorphic for projects and tasks)
- Time logs (with task association)
- Notifications (with user targeting)
- Attachments (polymorphic for projects and tasks)
- Activities (for audit logging)
- Project members (junction table)

Include up and down migrations, proper constraints, and seed data for testing.
```

**Context**: Database migration setup for development environment
**Output Quality**: 8/10
**Iterations**: 1 refinement for constraint optimization
**Final Result**: 9 migration files with proper dependency order and rollback capability

## Code Generation Prompts

### Prompt 3: API Endpoint Creation
**Prompt**:
```
Create Express.js API endpoints for user authentication with the following requirements:
- POST /auth/login - JWT authentication
- POST /auth/register - User registration with validation
- POST /auth/refresh - Token refresh mechanism
- POST /auth/logout - Token invalidation
- GET /auth/me - Current user profile

Include TypeScript types, input validation using express-validator, error handling, password hashing with bcrypt, and role-based middleware. Follow RESTful conventions and include proper HTTP status codes.
```

**Context**: Authentication system implementation, needed secure JWT-based auth
**Output Quality**: 9/10
**Modifications**: Added rate limiting and enhanced error messages
**Final Result**: Complete authentication system with security best practices

### Prompt 4: React Component Generation
**Prompt**:
```
Create a React TypeScript component for a Kanban board with the following features:
- Drag and drop functionality using react-beautiful-dnd
- Three columns: Todo, In Progress, Done
- Task cards showing title, assignee, priority, and due date
- Add new task functionality
- Edit task on double-click
- Filter by assignee and priority
- Responsive design with Tailwind CSS
- TypeScript interfaces for all props and state

Include proper error handling, loading states, and optimistic updates.
```

**Context**: Task management interface, needed interactive Kanban board
**Output Quality**: 8/10
**Modifications**: Enhanced accessibility and mobile responsiveness
**Final Result**: Fully functional Kanban board with all requested features

### Prompt 5: Database Model Associations
**Prompt**:
```
Create Sequelize model associations for a project management system with these relationships:
- Users have many Projects through ProjectMembers
- Projects have many Users through ProjectMembers  
- Projects have many Tasks
- Tasks belong to Project and User (assignee)
- Comments belong to User and are polymorphic (Project or Task)
- TimeLogs belong to User and Task
- Attachments are polymorphic (Project or Task)
- Activities track all model changes

Include proper TypeScript interfaces, foreign key constraints, and cascade delete rules where appropriate.
```

**Context**: ORM relationship setup, needed proper model associations
**Output Quality**: 9/10
**Iterations**: Added polymorphic association configuration
**Final Result**: Complete model association setup with proper TypeScript types

## Problem-Solving Prompts

### Prompt 6: Performance Optimization
**Prompt**:
```
Optimize this React component for rendering large datasets (1000+ items):

[Component code provided]

Requirements:
- Implement virtual scrolling for performance
- Add search and filtering without full re-renders
- Optimize re-render cycles using React.memo and useMemo
- Implement proper loading states and error boundaries
- Maintain accessibility standards

Provide both the optimized component and explanation of optimizations.
```

**Context**: Performance issues with large task lists, needed optimization
**Effectiveness**: Reduced render time from 2000ms to 150ms
**Final Result**: Virtualized list with search optimization and improved UX

### Prompt 7: Docker Configuration Optimization
**Prompt**:
```
Create a production-ready Docker setup for a full-stack application with:
- Node.js backend with TypeScript
- React frontend with Vite
- PostgreSQL database
- Nginx reverse proxy

Requirements:
- Multi-stage builds for size optimization
- Environment variable management
- Health checks for all services
- Development and production configurations
- Security best practices
- Proper networking between containers

Include docker-compose.yml and individual Dockerfiles.
```

**Context**: Deployment setup, needed containerized application
**Output Quality**: 9/10
**Iterations**: Added security configurations and health checks
**Final Result**: Complete Docker setup with production optimizations

### Prompt 8: Error Handling Strategy
**Prompt**:
```
Design a comprehensive error handling strategy for a full-stack TypeScript application including:
- Custom error classes with proper inheritance
- Centralized error handling middleware for Express
- Error boundary components for React
- User-friendly error messages
- Logging and monitoring integration
- Retry mechanisms for transient failures
- Graceful degradation strategies

Provide implementation examples and best practices.
```

**Context**: Application reliability, needed robust error handling
**Output Quality**: 8/10
**Modifications**: Enhanced logging and user feedback
**Final Result**: Comprehensive error handling system with monitoring

## Architecture Design Prompts

### Prompt 9: System Architecture Design
**Prompt**:
```
Design a scalable system architecture for a project management application with:
- 10,000+ users
- Real-time collaboration features
- File storage and processing
- Reporting and analytics
- Mobile and web clients
- Third-party integrations

Include:
- Service decomposition strategy
- Database design and scaling approach
- Caching strategy
- API design and versioning
- Security and authentication
- Deployment and infrastructure
- Monitoring and observability

Provide both high-level architecture diagram concepts and implementation details.
```

**Context**: Application scaling strategy, needed enterprise-ready architecture
**Output Quality**: 9/10
**Iterations**: Refined microservices boundaries and data consistency strategies
**Final Result**: Comprehensive architecture design with scaling roadmap

### Prompt 10: API Design Strategy
**Prompt**:
```
Design a RESTful API structure for a project management system with:
- Resource-based URLs
- Proper HTTP methods and status codes
- Pagination and filtering strategies
- Version management
- Rate limiting and throttling
- Authentication and authorization
- Error response format standardization
- API documentation structure

Include endpoint specifications, request/response examples, and OpenAPI documentation.
```

**Context**: API standardization, needed consistent interface design
**Output Quality**: 9/10
**Modifications**: Added GraphQL considerations and bulk operations
**Final Result**: Complete API specification with documentation

## Testing Prompts

### Prompt 11: Test Case Generation
**Prompt**:
```
Generate comprehensive test cases for an authentication API with:
- Unit tests for individual functions
- Integration tests for API endpoints
- Security tests for common vulnerabilities
- Performance tests for load handling
- Error scenario coverage

Include:
- Jest test setup and configuration
- Mock strategies for external dependencies
- Test data factories and fixtures
- Coverage requirements and reporting
- CI/CD integration

Provide both test code and testing strategy.
```

**Context**: Quality assurance, needed comprehensive test coverage
**Output Quality**: 8/10
**Iterations**: Added edge case coverage and security testing
**Final Result**: Complete test suite with 85% coverage

### Prompt 12: E2E Testing Strategy
**Prompt**:
```
Create an end-to-end testing strategy using Playwright for a project management application covering:
- User authentication flows
- Project creation and management
- Task operations (CRUD, status changes)
- Collaboration features (comments, mentions)
- File upload and download
- Responsive design testing

Include:
- Page object model implementation
- Test data management
- Cross-browser testing setup
- Visual regression testing
- Performance testing integration
- CI/CD pipeline integration

Provide test implementations and configuration.
```

**Context**: User experience validation, needed automated E2E testing
**Output Quality**: 8/10
**Modifications**: Enhanced visual testing and mobile scenarios
**Final Result**: Comprehensive E2E test suite with cross-browser coverage

## DevOps and Deployment Prompts

### Prompt 13: CI/CD Pipeline Configuration
**Prompt**:
```
Design a CI/CD pipeline for a full-stack TypeScript application with:
- Automated testing (unit, integration, E2E)
- Code quality checks (linting, type checking)
- Security scanning
- Build optimization
- Multi-environment deployment (staging, production)
- Rollback capabilities
- Performance monitoring

Include:
- GitHub Actions workflows
- Docker build and deployment
- Environment management
- Secret handling
- Monitoring and alerting
- Documentation automation

Provide complete workflow configurations and deployment scripts.
```

**Context**: Deployment automation, needed reliable release process
**Output Quality**: 9/10
**Iterations**: Added security scanning and performance monitoring
**Final Result**: Complete CI/CD pipeline with automated quality gates

### Prompt 14: Monitoring and Observability
**Prompt**:
```
Implement comprehensive monitoring and observability for a project management application including:
- Application performance monitoring (APM)
- Error tracking and alerting
- User experience monitoring
- Infrastructure monitoring
- Log aggregation and analysis
- Health check endpoints
- SLA monitoring and reporting

Include:
- Logging strategy and implementation
- Metrics collection and dashboards
- Alert configuration and escalation
- Performance optimization recommendations
- Incident response procedures

Provide implementation code and configuration examples.
```

**Context**: Production reliability, needed comprehensive monitoring
**Output Quality**: 8/10
**Modifications**: Enhanced alerting rules and dashboard design
**Final Result**: Complete observability stack with proactive monitoring

## Security Prompts

### Prompt 15: Security Implementation
**Prompt**:
```
Implement comprehensive security measures for a web application including:
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Authentication security (JWT, session management)
- Authorization and role-based access control
- Rate limiting and DDoS protection
- Secure headers and HTTPS enforcement
- Data encryption (at rest and in transit)
- Security audit logging

Include:
- Security middleware implementation
- Vulnerability scanning integration
- Security testing strategies
- Compliance considerations (GDPR, CCPA)
- Security documentation and procedures

Provide code examples and security checklists.
```

**Context**: Application security, needed production-ready security measures
**Output Quality**: 9/10
**Iterations**: Enhanced encryption and compliance features
**Final Result**: Comprehensive security implementation with audit capabilities

## Prompt Engineering Best Practices

### Effective Prompt Structure
1. **Context Setting**: Clearly define the problem domain and requirements
2. **Specific Requirements**: List detailed functional and non-functional requirements
3. **Technology Constraints**: Specify technologies, frameworks, and standards
4. **Output Format**: Define expected deliverable format and structure
5. **Quality Criteria**: Include success metrics and validation requirements

### Iteration Strategies
1. **Progressive Refinement**: Start broad, then add specific details
2. **Component Isolation**: Break complex requests into smaller, focused prompts
3. **Example Provision**: Include examples of desired output format
4. **Constraint Addition**: Add constraints incrementally to avoid over-specification
5. **Validation Requests**: Ask for explanation and reasoning behind recommendations

### Context Management
1. **File Context**: Include relevant existing code or documentation
2. **Project Context**: Provide overall project goals and architecture
3. **Technical Context**: Specify current technology stack and constraints
4. **Business Context**: Include user requirements and business objectives
5. **Quality Context**: Define testing, security, and performance requirements

### Quality Validation
1. **Code Review**: Always review AI-generated code for best practices
2. **Testing**: Validate generated code with appropriate tests
3. **Security Review**: Check for security vulnerabilities and best practices
4. **Performance Analysis**: Evaluate performance implications of generated solutions
5. **Maintainability**: Assess long-term maintainability and documentation quality

## Reusable Prompt Templates

### API Endpoint Template
```
Create a [FRAMEWORK] API endpoint for [RESOURCE] with the following requirements:
- HTTP Method: [METHOD]
- URL Pattern: [URL]
- Input Validation: [VALIDATION_RULES]
- Authentication: [AUTH_TYPE]
- Authorization: [ROLE_REQUIREMENTS]
- Business Logic: [BUSINESS_RULES]
- Response Format: [RESPONSE_STRUCTURE]
- Error Handling: [ERROR_SCENARIOS]

Include TypeScript types, proper HTTP status codes, and comprehensive error handling.
```

### React Component Template
```
Create a React TypeScript component for [COMPONENT_PURPOSE] with:
- Props: [PROP_DEFINITIONS]
- State Management: [STATE_STRATEGY]
- Event Handling: [EVENT_HANDLERS]
- Styling: [STYLING_APPROACH]
- Accessibility: [A11Y_REQUIREMENTS]
- Performance: [PERFORMANCE_CONSIDERATIONS]
- Error Handling: [ERROR_BOUNDARIES]

Include proper TypeScript interfaces and comprehensive prop validation.
```

### Database Design Template
```
Design a [DATABASE_TYPE] schema for [DOMAIN] with:
- Entities: [ENTITY_LIST]
- Relationships: [RELATIONSHIP_DEFINITIONS]
- Constraints: [CONSTRAINT_REQUIREMENTS]
- Indexes: [PERFORMANCE_REQUIREMENTS]
- Security: [ACCESS_CONTROL]
- Scaling: [SCALABILITY_CONSIDERATIONS]

Include migration scripts, model definitions, and seed data.
```

This prompt library represents tested, effective prompts that delivered high-quality results during the project development. Each prompt can be customized for specific use cases while maintaining the proven structure and context that ensures reliable AI assistance.
