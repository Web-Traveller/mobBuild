# mobBuild

AI-powered web app builder with MCP integration

## Overview

mobBuild is an intelligent web application builder that leverages AI and the Model Context Protocol (MCP) to generate full-stack applications. It provides modular code generation for frontend (React), backend (Node.js/Express), and database (PostgreSQL) components with seamless orchestration.

## Features

- 🤖 **AI-Powered Code Generation**: Automatically generate application code based on high-level requirements
- 🔌 **MCP Integration**: Leverage Model Context Protocol for coordinated multi-service operations
- 🏗️ **Modular Architecture**: Separate generators for frontend, backend, and database layers
- 🎯 **Type-Safe**: Built with TypeScript for enhanced developer experience
- 🔄 **Extensible**: Easy to add new generators and MCP servers

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js >=18.0.0
- **Frontend Generation**: React with TypeScript
- **Backend Generation**: Express/Fastify with TypeScript
- **Database Generation**: PostgreSQL schema generation
- **Architecture**: MCP-based orchestration

## Project Structure

```
src/
├── types/              # TypeScript interfaces and types
│   ├── app.ts          # Application definition types
│   ├── generator.ts    # Code generation types
│   └── mcp.ts          # MCP integration types
├── generators/         # Code generation engines
│   ├── frontend/       # React component generator
│   ├── backend/        # Node.js/Express generator
│   └── database/       # PostgreSQL schema generator
├── mcp/                # MCP integration
│   ├── servers/        # MCP server definitions
│   └── orchestrator.ts # MCP orchestration logic
├── orchestrator/       # AI orchestration engine
│   └── engine.ts       # Core orchestration logic
├── utils/              # Utilities and helpers
│   └── logger.ts       # Logging utility
└── index.ts            # Main entry point
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mobbuild
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables as needed.

### Development

Run the development server with hot reload:
```bash
npm run dev
```

### Building

Build the TypeScript project for production:
```bash
npm run build
```

### Running in Production

Start the compiled application:
```bash
npm start
```

### Code Quality

Lint your code:
```bash
npm run lint
```

Fix linting issues automatically:
```bash
npm run lint:fix
```

Format code with Prettier:
```bash
npm run format
```

Check code formatting:
```bash
npm run format:check
```

## Architecture

### Code Generators

mobBuild includes three main code generators:

1. **Frontend Generator**: Creates React components with TypeScript
2. **Backend Generator**: Generates Express/Fastify API endpoints
3. **Database Generator**: Produces PostgreSQL schemas and migrations

### MCP Integration

The Model Context Protocol (MCP) integration enables:

- Coordinated operations across multiple services
- Server registration and capability discovery
- Request/response handling with proper error management
- Status monitoring and health checks

### Orchestration Engine

The orchestration engine coordinates all generators and MCP servers to:

- Parse application requirements
- Generate code across all layers
- Manage dependencies between components
- Handle errors and rollbacks

## Configuration

Configuration is managed through environment variables. See `.env.example` for available options:

- `NODE_ENV`: Environment (development/production/staging)
- `PORT`: Server port
- `LOG_LEVEL`: Logging verbosity (debug/info/warn/error)
- API keys and service configurations (to be added as needed)

## Development Guidelines

- Follow TypeScript strict mode conventions
- Use the provided logger for all logging operations
- Implement proper error handling in all async functions
- Add types for all public APIs
- Keep generators modular and independent

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting: `npm run lint:fix && npm run format`
4. Build the project: `npm run build`
5. Submit a pull request

## License

MIT

## Roadmap

- [ ] Complete frontend generator implementation
- [ ] Complete backend generator implementation
- [ ] Complete database generator implementation
- [ ] Implement AI model integration
- [ ] Add GitHub integration for repository creation
- [ ] Build web UI for configuration
- [ ] Add testing framework and tests
- [ ] Implement CI/CD pipeline
- [ ] Add documentation generation

## Support

For issues and questions, please open an issue on GitHub.
