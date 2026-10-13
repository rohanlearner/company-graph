# Technical Documentation - Company Knowledge Graph Agent

## System Overview

The Company Knowledge Graph Agent is a multi-agent system designed to ingest, connect, and query company knowledge from diverse sources. Built using the Ruflo framework, it implements a hierarchical-mesh topology for agent coordination with message-first communication patterns.

## Core Components

### 1. Agent Architecture

#### Base Agent Class (`src/agents/agent.js`)
Provides common functionality for all specialized agents:
- Task queue management
- Message handling capabilities
- Status tracking (pending, in_progress, completed)
- Unique identification system
- Logging and error handling base

#### Specialized Agents
Each agent type extends the base Agent class with specific capabilities:

**ResearcherAgent** (`src/agents/researcherAgent.js`)
- Researches codebase patterns and dependencies
- Analyzes architectural decisions
- Discovers potential data sources
- Maps internal/external dependencies
- Identifies design patterns in existing code

**ArchitectAgent** (`src/agents/architectAgent.js`)
- Designs the knowledge graph schema
- Defines core entities: Person, Team, Project, Document, Decision
- Specifies relationships between entities
- Plans data storage strategies (FalkorDB integration)
- Ensures architectural consistency

**CoderAgent** (`src/agents/coderAgent.js`)
- Implements the data ingestion pipeline
- Creates connectors for various data sources
- Builds the core agent functionality
- Handles data transformation and storage
- Implements API interfaces for agent communication

**TesterAgent** (`src/agents/testerAgent.js`)
- Creates comprehensive test scenarios
- Validates agent responses include source attribution
- Tests performance under various data loads
- Verifies decision tracing capabilities
- Ensures data quality and integrity

**ReviewerAgent** (`src/agents/reviewerAgent.js`)
- Performs code quality reviews
- Checks for security vulnerabilities
- Validates compliance with requirements
- Ensures presentation readiness
- Provides feedback for improvement

### 2. Backend Infrastructure

#### DataIngestionPipeline (`src/backend/dataIngestion.js`)
A flexible, configurable pipeline for processing data from various sources:

**Key Features:**
- **Staged Processing**: Data flows through configurable stages
- **Processor Registration**: Custom processing functions can be registered
- **Filter System**: Conditional processing based on data properties
- **Transformer Capabilities**: Data format conversion and enrichment
- **Batch Processing**: Efficient handling of large datasets
- **Retry Mechanisms**: Automatic recovery from transient failures
- **Metrics Collection**: Tracks processing statistics and performance
- **Continue-on-Error Configuration**: Configurable error handling

**Usage Pattern:**
```javascript
const pipeline = new DataIngestionPipeline({batchSize: 100, maxRetries: 3});

// Register components
pipeline.registerProcessor('csv-parser', csvParseFunction);
pipeline.registerFilter('data-validator', validationFunction);
pipeline.registerTransformer('json-normalizer', normalizationFunction);

// Configure pipeline stages
pipeline.addStage('ingestion', {enabled: true})
        .addProcessorToStage('ingestion', 'csv-parser')
        .addFilterToStage('ingestion', 'data-validator')
        .addTransformerToStage('ingestion', 'json-normalizer');

// Process data
const results = await pipeline.process(rawData);
```

#### WorkflowDAG (`src/backend/workflow.js`)
Manages task execution as a Directed Acyclic Graph:

**Core Functionality:**
- **Task Management**: Add, track, and update task status
- **Dependency Resolution**: Kahn's algorithm for topological sorting
- **Cycle Detection**: Prevents circular dependencies
- **Execution Ordering**: Determines optimal task execution sequence
- **Ready Task Identification**: Finds tasks whose dependencies are satisfied
- **Serialization/Deserialization**: Persists workflow state

**Key Methods:**
- `addTask(task)`: Adds a task to the workflow
- `addDependency(fromTaskId, toTaskId)`: Creates task dependencies
- `hasCycle()`: Detects circular dependencies
- `updateExecutionOrder()`: Recalculates topological sort
- `getReadyTasks()`: Returns tasks ready for execution
- `startExecution(agentFactory)`: Begins workflow execution
- `getStatus()`: Returns current workflow status
- `serialize()` / `deserialize(data)`: Persists/restores workflow state

**Execution Flow:**
1. Tasks are added to the workflow
2. Dependencies are established between tasks
3. Workflow calculates execution order using topological sort
4. Execution begins with tasks having no dependencies
5. As tasks complete, dependent tasks become eligible for execution
6. Workflow completes when all tasks are finished

### 3. Communication Patterns

#### Message-First Coordination
Agents communicate exclusively through `SendMessage` calls:
- No polling or shared state
- Direct agent-to-agent messaging
- Clear communication flow: Lead ↔ architect ↔ developer ↔ tester ↔ reviewer
- Each agent knows exactly who to message and what to send

#### Example Communication Flow:
```javascript
// Researcher agent finds information and sends to architect
SendMessage({
  to: "architect",
  summary: "Research complete",
  message: {
    findings: researchResults,
    recommendations: [...]
  }
});

// Architect agent receives research, designs solution, sends to coder
SendMessage({
  to: "coder",
  summary: "Design ready",
  message: {
    schema: graphSchema,
    relationships: [...],
    implementationPlan: [...]
  }
});
```

### 4. Ruflo Framework Integration

#### Memory System
- Vector embeddings for semantic search
- Pattern storage and retrieval via ReasoningBank
- HNSW indexing for fast similarity search
- Cross-session memory persistence
- Hierarchical memory (working, episodic, semantic tiers)

#### Swarm Intelligence
- Hierarchical-mesh topology configuration
- Anti-drift gates for maintaining coherence
- Consensus strategies (Raft as default)
- Shared memory namespace
- Pheromone-based adaptive topology (configurable)

#### Hooks System
- Pre/post-task hooks for learning
- Model routing based on task complexity
- Codemod hooks for deterministic transformations
- Worker dispatch system for background tasks
- Intelligence gathering and pattern learning

#### Background Workers
- `audit`: Runs after security changes
- `optimize`: Runs after performance work
- `testgaps`: Runs after adding features
- `map`: Runs every 5+ file changes
- `document`: Runs after API changes

### 5. Model Routing Strategy

#### 3-Tier Model Routing
The system implements Ruflo's 3-tier model routing concept:

**Tier 1 - Agent Booster (WASM)**
- Used for simple transformations
- Skip LLM entirely when possible
- Examples: var-to-const, remove-console, add-logging

**Tier 2 - Haiku**
- Handles simple, low-complexity tasks
- Fast and cost-effective
- Examples: basic data validation, simple transformations

**Tier 3 - Sonnet/Opus**
- Reserved for complex reasoning tasks
- Architecture decisions, security analysis, complex algorithms
- Examples: schema design, complex query optimization, security review

#### Routing Decision Process
1. Task analysis via `hooks route --task "[description]"`
2. Model selection based on complexity assessment
3. Execution with selected model
4. Outcome recording via `hooks post-task` for learning

### 6. Implementation Details

#### ResearcherAgent Implementation
The ResearcherAgent processes various task types:
- `research-codebase`: Analyzes codebase structure and patterns
- `analyze-dependencies`: Maps internal/external dependencies
- `find-patterns`: Identifies recurring code patterns
- `architecture-review`: Reviews system architecture decisions
- `data-source-discovery`: Identifies potential data sources
- `generalResearch`: Handles unspecified research inquiries

Each method returns structured findings with:
- Agent identification and timestamp
- Research type and scope
- Discoveries and recommendations
- Confidence scoring

#### DataIngestionPipeline Implementation
The pipeline uses a staged approach:
1. **Filters**: Remove or skip unwanted data
2. **Transformers**: Convert data formats as needed
3. **Processors**: Apply business logic and transformations
4. **Metrics Collection**: Tracks processing statistics throughout

Each stage can be independently enabled/disabled and configured with specific processors, filters, and transformers.

#### WorkflowDAG Implementation
The workflow manager:
- Uses Kahn's algorithm for topological sorting
- Detects and prevents circular dependencies
- Maintains execution order based on dependencies
- Provides ready-task identification for efficient scheduling
- Supports serialization for persistence and recovery

### 7. Extensibility Points

#### Adding New Agent Types
1. Create new agent file in `src/agents/` extending base Agent class
2. Implement `processTask(task)` method for handling specific task types
3. Register agent type in team coordination patterns
4. Define specific task types the agent can handle

#### Extending Data Ingestion Pipeline
1. Register new processors via `registerProcessor(name, function)`
2. Register new filters via `registerFilter(name, function)`
3. Register new transformers via `registerTransformer(name, function)`
4. Create new stages or modify existing ones with `addStage()`
5. Add components to stages via `addProcessorToStage()`, etc.

#### Customizing Workflow Execution
1. Modify `startExecution()` method for custom execution logic
2. Add custom task status handling
3. Implement different dependency resolution strategies
4. Add custom metrics collection or reporting

## Integration Guidelines

### FalkorDB Integration (Planned)
To complete the knowledge graph storage:
1. Install FalkorDB driver: `npm install falkordb`
2. Create database connection manager
3. Implement node/edge storage mappings
4. Develop query translation layer (natural language to Cypher/GQL)
5. Add connection pooling and retry logic

### Data Source Connectors (Planned)
For each data source type:
1. Create connector module following standard interface
2. Implement authentication and connection handling
3. Develop data extraction and normalization logic
4. Add error handling and retry mechanisms
5. Create configuration schema for connector settings

### Natural Language Query Interface (Planned)
1. Implement query parsing and intent recognition
2. Develop graph query generation from natural language
3. Add result formatting and source attribution
4. Implement confidence scoring for query results
5. Add query caching for performance optimization

## Testing Approach

### Unit Testing
- Test individual agent methods in isolation
- Mock dependencies for focused testing
- Verify return values and side effects
- Test error conditions and edge cases

### Integration Testing
- Test agent communication patterns
- Verify workflow execution with real dependencies
- Test data ingestion pipeline end-to-end
- Validate message passing between agents

### Performance Testing
- Measure throughput of data ingestion pipeline
- Test workflow execution time with varying task counts
- Evaluate memory usage under load
- Test concurrent agent communication limits

## Deployment Considerations

### Environment Requirements
- Node.js >= 16.x
- Ruflo CLI installed globally
- FalkorDB instance (for production deployment)
- Access to configured data sources

### Configuration
- Environment variables for database connections
- API keys for external services
- Ruflo configuration for swarm topology and memory
- Agent-specific configuration files

### Scaling
- Horizontal scaling of agent instances
- Load balancing for message distribution
- Database connection pooling
- Caching strategies for frequent queries
- Asynchronous processing for non-critical tasks

## Security Considerations

### Data Protection
- Encryption for sensitive data at rest and in transit
- Access controls for data source connectors
- Input validation and sanitization
- Secure configuration management
- Audit logging for data access

### Agent Security
- Principle of least privilege for agent capabilities
- Secure inter-agent communication
- Regular security reviews by ReviewerAgent
- Vulnerability scanning integration
- Dependency tracking and updating

## Performance Optimizations

### Caching Strategy
- Frequently accessed graph nodes/edges
- Query results for common requests
- Agent response caching for repetitive tasks
- Metadata caching for schema information

### Database Optimization
- Appropriate indexing for FalkorDB
- Connection pooling for database access
- Query optimization for common patterns
- Batch operations for bulk data processing

### Agent Communication
- Message batching where appropriate
- Asynchronous non-blocking communication
- Efficient serialization/deserialization
- Connection reuse for agent messaging

## Monitoring and Observability

### Metrics Collection
- Task execution times and success rates
- Data ingestion throughput and latency
- Agent communication frequency and volume
- Memory usage and garbage collection metrics
- Error rates and failure patterns

### Logging
- Structured logging for agent activities
- Performance timing logs
- Error tracking with stack traces
- Audit trails for data modifications
- Debug logging for development scenarios

### Health Checks
- Agent availability and responsiveness
- Database connectivity status
- Message queue health
- Resource utilization monitoring
- Dependency service availability

## Future Enhancements

### Advanced Features
1. Real-time data synchronization with source systems
2. Collaborative editing and version control for knowledge
3. Advanced analytics and insights generation
4. Natural language report generation
5. Integration with enterprise SSO and identity systems

### Performance Improvements
1. Graph partitioning for large-scale deployments
2. In-memory caching layers for hot data
3. Predictive prefetching of related data
4. Adaptive batch sizing based on load
5. GPU acceleration for vector operations

### User Experience
1. Web-based visualization interface
2. Interactive graph exploration tools
3. Customizable dashboards and views
4. Export capabilities for various formats
5. API access for external integrations

---
*Technical documentation for Company Knowledge Graph Agent hackathon project*