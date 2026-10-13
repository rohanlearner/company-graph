# System Architecture - Company Knowledge Graph Agent

## High-Level Architecture

```
+---------------------+      +---------------------+      +---------------------+
|    Data Sources     |      |  Data Ingestion     |      |  Knowledge Graph    |
|  (Docs, Tickets,    | ---> |   Pipeline          | ---> |   Storage (FalkorDB)|
|   Chat, PM, Wiki)   |      |                     |      |                     |
+---------------------+      +---------------------+      +---------------------+
                                   |                               ^
                                   v                               |
                         +---------------------+           +---------------------+
                         |    Agent System     |           |    Query Interface  |
                         |  (Hierarchical-Mesh |           |  (Natural Language) |
                         |   Topology)         | <-------- |                     |
                         +---------------------+           +---------------------+
                                   |                               ^
                                   v                               |
                         +---------------------+           +---------------------+
                         |  Monitoring &       |           |    Presentation     |
                         |  Logging            |           |    Layer            |
                         +---------------------+           +---------------------+
```

## Agent Coordination Topology

```
                          +------------------+
                          |       Lead       | (You)
                          +------------------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
      +------------------+  +------------------+  +------------------+
      |   Architect      |  |     Researcher   |  |   Coordinator    |
      +------------------+  +------------------+  +------------------+
              |                    |                    |
      +------------------+  +------------------+  +------------------+
      |     Developer    |  |     Tester       |  |   Reviewer       |
      +------------------+  +------------------+  +------------------+
              |                    |                    |
              +----------+---------+---------+----------+
                         |
                    +------------------+
                    |   Shared Memory  |
                    |  (Ruflo Memory)  |
                    +------------------+
```

Note: Arrows indicate primary communication directions via SendMessage
All agents can communicate bidirectionally as needed in the hierarchical-mesh topology

## Data Flow

1. **Ingestion Phase**
   ```
   Data Sources → Data Ingestion Pipeline → Processed Data → Knowledge Graph Storage
   ```

2. **Query Processing Phase**
   ```
   User Query → Lead Agent → (Router to appropriate agents) → 
   Knowledge Graph Access → Response Formation → User Response
   ```

3. **Learning & Improvement Phase**
   ```
   Task Completion → Hooks System → Pattern Storage → 
   Model Routing Updates → Future Task Optimization
   ```

## Component Details

### Data Ingestion Pipeline
```
Raw Data Input
       ↓
[Stage 1: Validation] → [Stage 2: Transformation] → [Stage 3: Enrichment]
       ↓                               ↓                    ↓
   Filtering                      Format             Metadata
   & Validation                   Conversion         Addition
       ↓                               ↓                    ↓
[Stage 4: Storage Preparation] → Knowledge Graph Storage
       ↓
   Batch Optimization &
   Error Handling
```

### Workflow Execution
```
Task A (no deps) ────→ Task B ──┐
       ↓                        ↓
Task C (no deps) ────→ Task D ──→ Task E
       ↓                        ↓
Task F (no deps) ────→ Task G ───┘
```
Where arrows represent dependencies (source → dependent task)

### Message Passing Example
```
Researcher → SendMessage → Architect
    ↑                                 |
    |                                 ↓
    ←─────────────── Feedback ◀────── Reviewer
    ↑                                 |
    |                                 ↓
Developer ← SendMessage ◀─────────── Tester
```

## Technology Stack

### Core Technologies
- **Node.js**: Runtime environment
- **Ruflo Framework**: Agent coordination, memory, swarm intelligence
- **FalkorDB**: Graph database (planned integration)
- **JavaScript/ES6**: Implementation language

### Ruflo Components Utilized
- **Agent System**: Specialized agent types with message-first coordination
- **Memory System**: Vector embeddings, pattern storage, hierarchical memory
- **Swarm Intelligence**: Hierarchical-mesh topology, anti-drift gates
- **Hooks System**: Pre/post-task processing, model routing, learning
- **Background Workers**: Audit, optimization, test gaps, mapping, documentation

### Agent Responsibilities

#### Lead (User)
- Initiates tasks and provides context
- Receives final responses and reports
- Coordinates overall objectives

#### Researcher Agent
- Investigates technologies and approaches
- Analyzes codebase and dependencies
- Discovers data sources and integration points
- Researches architectural patterns

#### Architect Agent
- Designs knowledge graph schema
- Defines entity types and relationships
- Plans data storage and indexing strategies
- Ensures architectural consistency

#### Developer Agent (CoderAgent)
- Implements data ingestion pipeline
- Builds core agent functionality
- Creates data source connectors
- Develops agent communication interfaces

#### Tester Agent
- Creates test scenarios and test data
- Validates agent responses include source attribution
- Tests performance with varying data loads
- Verifies decision tracing capabilities

#### Reviewer Agent
- Reviews code quality and adherence to standards
- Checks for security vulnerabilities
- Validates compliance with requirements
- Ensures presentation readiness

## Communication Protocols

### Inter-Agent Communication
- **Primary Mechanism**: `SendMessage` calls with JSON payloads
- **Message Structure**:
  ```json
  {
    "to": "agent-name",
    "summary": "brief description",
    "message": {
      "taskId": "unique-id",
      "payload": {...},
      "timestamp": "ISO timestamp",
      "agentId": "sending-agent-id"
    }
  }
  ```
- **Delivery**: Automatic, no polling required
- **Acknowledgement**: Implicit through response messages

### Internal Agent Processing
- **Task Queue**: FIFO processing with priority support
- **Status Tracking**: pending → in_progress → completed/failed
- **Error Handling**: Try/catch blocks with error propagation
- **Logging**: Structured logging for debugging and monitoring

## Data Models

### Knowledge Graph Entities
```
Person: {
  id: string,
  name: string,
  role: string,
  teamId: string,
  contactInfo: object,
  skills: string[],
  startDate: date
}

Team: {
  id: string,
  name: string,
  department: string,
  managerId: string,
  members: string[],
  createdDate: date
}

Project: {
  id: string,
  name: string,
  description: string,
  ownerId: string,
  teamId: string,
  startDate: date,
  endDate: date,
  status: string,
  budget: number
}

Document: {
  id: string,
  title: string,
  type: string,
  creatorId: string,
  createdDate: date,
  content: string,
  tags: string[],
  version: number
}

Decision: {
  id: string,
  description: string,
  madeBy: string[],
  relatedTo: string[], // IDs of related entities
  date: date,
  rationale: string,
  outcome: string
}
```

### Relationship Types
- `WORKS_ON`: Person → Project
- `OWNS`: Team → Project, Person → Document
- `CREATED`: Person → Document, Decision
- `DECIDED_BY`: Project → Decision, Team → Decision
- `RELATED_TO`: Entity ↔ Entity (generic)
- `PART_OF`: Person → Team, Document → Project
- `DEPENDS_ON`: Project → Project, Task → Task

## Security Considerations

### Data Protection
- Encryption for sensitive data in transit and at rest
- Role-based access control for data sources
- Input validation and sanitization
- Secure configuration management
- Audit logging for all data access

### Agent Security
- Principle of least privilege for agent capabilities
- Secure inter-agent communication channels
- Regular security scanning and updates
- Dependency vulnerability monitoring
- Secure secret management

## Performance Characteristics

### Data Ingestion
- **Throughput**: Configurable batch processing
- **Latency**: Parallel stage processing where possible
- **Scalability**: Horizontal scaling of pipeline instances
- **Reliability**: Retry mechanisms and error handling

### Query Processing
- **Response Time**: Sub-second for common queries
- **Throughput**: Concurrent query handling
- **Scalability**: Database read replicas and caching
- **Availability**: Fault-tolerant design with fallbacks

### Agent Coordination
- **Message Latency**: Minimal direct messaging overhead
- **Throughput**: High-volume message handling
- **Scalability**: Horizontal agent scaling
- **Reliability**: Message persistence and replay capability

## Deployment Architecture

### Development Environment
```
Local Machine:
- Node.js runtime
- Ruflo CLI installed
- Local development database (SQLite/Mock)
- IDE with debugging capabilities
```

### Testing Environment
```
CI/CD Pipeline:
- Automated test execution
- Code quality checks
- Security scanning
- Performance benchmarking
```

### Production Environment
```
Deployment Target:
- Containerized deployment (Docker/Kubernetes)
- Load balancer for agent distribution
- Database cluster for high availability
- Monitoring and logging stack
- Backup and disaster recovery
```

### Configuration Management
- Environment-specific configuration files
- Secret management for credentials
- Feature flags for gradual rollouts
- Health check endpoints
- Metrics exposure for monitoring

## Extensibility Guidelines

### Adding New Data Sources
1. Create connector module implementing standard interface
2. Add authentication and connection handling
3. Implement data extraction and normalization
4. Configure in DataIngestionPipeline
5. Test with sample data

### Adding New Agent Types
1. Create new agent class extending base Agent
2. Implement processTask() method for specific task types
3. Define communication patterns with other agents
4. Add to swarm topology configuration
5. Test in isolation and with existing agents

### Extending Knowledge Graph Schema
1. Define new entity types in ArchitectAgent
2. Specify relationship types to/from new entities
3. Update data ingestion mappings
4. Modify query translation layer
5. Update validation and testing procedures

## Failure Scenarios and Handling

### Network Partition
- Agents detect disconnected peers
- Switch to local operation mode
- Queue messages for delivery on reconnection
- Maintain consistency through eventual consistency model

### Database Failure
- Automatic failover to replica (if configured)
- Queue write operations during downtime
- Alert monitoring systems
- Provide degraded service for read operations

### Agent Failure
- Supervisor detection through missed heartbeats
- Automatic restart of failed agents
- Task redistribution to healthy agents
- Maintain work persistence through message queue

### Data Corruption
- Validation checks at ingestion time
- Integrity verification for stored data
- Backup and restore procedures
- Manual intervention procedures for severe cases

## Monitoring and Observability

### Key Metrics
- **Ingestion Rate**: Records processed per second
- **Query Latency**: Time to return query results
- **Agent Utilization**: Percentage of time agents are busy
- **Message Volume**: Number of messages exchanged
- **Error Rates**: Failed tasks and exceptions
- **Memory Usage**: RAM consumption by agents and system
- **Disk Usage**: Storage consumption for knowledge graph

### Health Checks
- Agent responsiveness (ping/pong)
- Database connectivity and query performance
- Message queue depth and processing rate
- System resource utilization (CPU, memory, disk)
- External service connectivity (data sources)

### Alerting Thresholds
- Ingestion rate drops below minimum threshold
- Query latency exceeds maximum acceptable time
- Agent failure rate exceeds threshold
- Memory usage exceeds configurable limit
- Disk usage approaching capacity limits

## Conclusion

This architecture provides a solid foundation for a Company Knowledge Graph Agent that can:
1. Ingest data from diverse company sources
2. Connect related information through a graph model
3. Provide intelligent query responses with source attribution
4. Learn and improve from interactions over time
5. Scale to meet growing organizational needs
6. Maintain security and reliability standards

The modular design allows for incremental implementation and extension, making it suitable for both proof-of-concept and production deployment scenarios.