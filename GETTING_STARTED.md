# Getting Started - Company Knowledge Graph Agent

## Prerequisites

Before you begin, ensure you have installed:
- Node.js >= 16.x
- npm (comes with Node.js)
- Ruflo CLI (installed globally)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd company-knowledge-graph-agent
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Ruflo CLI globally (if not already installed):
   ```bash
   npm install -g @claude-flow/cli
   ```

4. Initialize Ruflo in the project:
   ```bash
   npx @claude-flow/cli@latest init --wizard
   ```

## Project Structure

```
company-knowledge-graph-agent/
├── src/
│   ├── agents/
│   │   ├── agent.js              # Base agent class
│   │   ├── architectAgent.js     # System architecture agent
│   │   ├── coderAgent.js         # Implementation agent
│   │   ├── message.js            # Inter-agent communication
│   │   ├── researcherAgent.js    # Research and analysis agent
│   │   ├── reviewerAgent.js      # Code quality and security reviewer
│   │   ├── task.js               # Task management
│   │   └── testerAgent.js        # Testing and validation agent
│   └── backend/
│       ├── dataIngestion.js      # Data ingestion pipeline
│       └── workflow.js           # Workflow DAG management
├── tests/                        # Test files (to be created)
├── docs/                         # Documentation (to be created)
├── config/                       # Configuration files
├── scripts/                      # Utility scripts
├── package.json
└README.md
```

## Development Workflow

### 1. Starting the Development Server

To start working on the project:

```bash
# Start Ruflo daemon
npx @claude-flow/cli@latest daemon start

# Run diagnostics to ensure everything is working
npx @claude-flow/cli@latest doctor --fix
```

### 2. Creating and Running Agents

To create and run a researcher agent:

```bash
npx @claude-flow/cli@latest agent spawn --type researcher --name researcher1
```

To send a task to the agent:

```bash
npx @claude-flow/cli@latest agent prompt --agent researcher1 --prompt "Research the codebase structure and dependencies"
```

### 3. Creating a Swarm

To create a hierarchical-mesh swarm for coordinated work:

```bash
npx @claude-flow/cli@latest swarm init \
  --topology hierarchical-mesh \
  --max-agents 5 \
  --strategy specialized \
  --name kg-agent-swarm
```

### 4. Running Tests

To run tests (once implemented):

```bash
npm test
```

### 5. Building for Production

To build the project for production:

```bash
npm run build
```

## Key Configuration Files

### Ruflo Configuration (`~/.claude/settings.json`)
This file contains Ruflo-specific configuration:
- Swarm topology settings
- Memory configuration
- Hooks configuration
- Background worker settings

### Environment Variables
Create a `.env` file in the project root:
```
# Database configuration
FALKORDB_HOST=localhost
FALKORDB_PORT=6379
FALKORDB_PASSWORD=your_password

# API keys for external services
JIRA_API_KEY=your_jira_key
SLACK_BOT_TOKEN=your_slack_token
GITHUB_TOKEN=your_github_token

# Application settings
NODE_ENV=development
LOG_LEVEL=info
```

## Common Development Tasks

### Researching the Codebase
To have the researcher agent analyze the codebase:

```bash
npx @claude-flow/cli@latest agent prompt \
  --agent researcher1 \
  --prompt "Analyze the codebase structure, identify key components, and map dependencies"
```

### Designing the Architecture
To have the architect agent design the knowledge graph schema:

```bash
npx @claude-flow/cli@latest agent prompt \
  --agent architect1 \
  --prompt "Design a knowledge graph schema for company data including Person, Team, Project, Document, and Decision entities"
```

### Implementing Features
To have the coder agent implement a feature:

```bash
npx @claude-flow/cli@latest agent prompt \
  --agent coder1 \
  --prompt "Implement the data ingestion pipeline with CSV and JSON processing capabilities"
```

### Testing Implementation
To have the tester agent create test scenarios:

```bash
npx @claude-flow/cli@latest agent prompt \
  --agent tester1 \
  --prompt "Create test scenarios for the data ingestion pipeline including valid and invalid data formats"
```

### Reviewing Code
To have the reviewer agent check code quality:

```bash
npx @claude-flow/cli@latest agent prompt \
  --agent reviewer1 \
  --prompt "Review the code quality and security of the data ingestion pipeline implementation"
```

## Troubleshooting

### Ruflo Daemon Issues
If the Ruflo daemon fails to start:
```bash
# Check daemon status
npx @claude-flow/cli@latest daemon status

# Restart daemon
npx @claude-flow/cli@latest daemon restart

# View daemon logs
npx @claude-flow/cli@latest daemon logs
```

### Agent Communication Problems
If agents aren't communicating properly:
```bash
# Check swarm status
npx @claude-flow/cli@latest swarm status

# List active agents
npx @claude-flow/cli@latest agent list

# Check message queue
npx @claude-flow/cli@latest swarm messages
```

### Memory Issues
If experiencing memory-related problems:
```bash
# Check memory status
npx @claude-flow/cli@latest memory status

# Search for specific patterns
npx @claude-flow/cli@latest memory search --query "your search term"

# Store a test pattern
npx @claude-flow/cli@latest memory store --key test-pattern --value "This is a test pattern"
```

## Next Steps for Development

1. **Complete FalkorDB Integration**
   - Install FalkorDB driver: `npm install falkordb`
   - Create database connection module
   - Implement node/edge storage functions
   - Create query translation layer

2. **Implement Data Source Connectors**
   - Start with one connector (e.g., GitHub Issues)
   - Implement authentication and data extraction
   - Add error handling and retry logic
   - Test with sample data

3. **Develop Natural Language Interface**
   - Implement query parsing and intent recognition
   - Create graph query generation from natural language
   - Add result formatting and source attribution

4. **Create Visualization Components**
   - Implement basic graph visualization
   - Add interactive exploration capabilities
   - Create dashboard for key metrics

5. **Build Demo Scenarios**
   - Create sample company data
   - Develop predefined queries for demonstration
   - Create presentation materials

## Code Style Guidelines

### JavaScript/ES6 Standards
- Use `const` and `let` instead of `var`
- Prefer arrow functions for callbacks
- Use template literals for string concatenation
- Follow ES6 module syntax (`import`/`export`)
- Use destructuring where appropriate

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and constructors
- Use UPPER_SNAKE_CASE for constants
- Prefix private methods with underscore (`_`)

### Code Organization
- Keep functions focused and under 50 lines
- Group related functionality in classes/modules
- Add JSDoc comments for public APIs
- Separate concerns: data access, business logic, presentation

### Error Handling
- Use try/catch for asynchronous operations
- Provide meaningful error messages
- Log errors appropriately for debugging
- Handle edge cases explicitly

## Getting Help

If you encounter issues:
1. Check the Ruflo documentation: `npx @claude-flow/cli@latest --help`
2. Review the code comments and documentation
3. Look for similar patterns in the existing codebase
4. Ask for help in the project's communication channels
5. Check the troubleshooting section above

---
*Happy coding! Remember to follow the agent communication patterns and always name your agents for proper coordination.*