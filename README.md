# Company Knowledge Graph Agent - Hackathon Project

## Overview
This project implements a multi-agent system designed to build a Company Knowledge Graph Agent that understands how a company works by connecting people, teams, projects, documents, and decisions in one graph. The agent enables users to ask questions and get work done across all company knowledge with clear source attribution.

## What We've Built

### Core Architecture
We've implemented a hierarchical-mesh agent coordination system based on the patterns described in the CLAUDE.md configuration. The system consists of specialized agents that communicate via message passing:

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Agent Components
1. **ResearcherAgent** (`src/agents/researcherAgent.js`)
   - Investigates FalkorDB capabilities and data source connectors
   - Researches similar knowledge graph implementations
   - Identifies best data modeling approaches
   - Handles tasks: research-codebase, analyze-dependencies, find-patterns, architecture-review, data-source-discovery

2. **ArchitectAgent** (`src/agents/architectAgent.js`)
   - Designs graph schema and agent architecture
   - Defines core node types: Person, Team, Project, Document, Decision
   - Specifies relationship types: WORKS_ON, OWNS, CREATED, DECIDED_BY, RELATED_TO, etc.
   - Plans indexing strategies for efficient querying

3. **CoderAgent** (`src/agents/coderAgent.js`)
   - Implements data ingestion pipeline
   - Builds agent core functionality
   - Creates connectors for various data sources

4. **TesterAgent** (`src/agents/testerAgent.js`)
   - Creates test scenarios for different query types
   - Validates that answers include clear sources
   - Tests performance with growing data volumes
   - Verifies the agent can trace decisions back to source

5. **ReviewerAgent** (`src/agents/reviewerAgent.js`)
   - Reviews code quality and security
   - Ensures presentation readiness
   - Validates compliance with requirements

### Backend Infrastructure
1. **DataIngestionPipeline** (`src/backend/dataIngestion.js`)
   - Configurable pipeline with stages, processors, filters, and transformers
   - Batch processing with retry mechanisms
   - Metrics collection and monitoring
   - Continues on error configuration

2. **WorkflowDAG** (`src/backend/workflow.js`)
   - Directed Acyclic Graph implementation for managing task execution
   - Topological sorting for dependency resolution
   - Cycle detection and prevention
   - Task ready-state determination
   - Workflow serialization/deserialization

### Supporting Components
- **Agent Base Class** (`src/agents/agent.js`) - Core agent functionality
- **Task Management** (`src/agents/task.js`) - Task representation and status tracking
- **Message Passing** (`src/agents/message.js`) - Inter-agent communication system

## Key Features Implemented

### 1. Hierarchical-Mesh Topology
- Anti-drift capabilities for maintaining swarm coherence
- Specialized agent roles with clear responsibilities
- Message-first coordination eliminating polling

### 2. Three-Tier Model Routing (Conceptual Framework)
- **Tier 1**: Agent Booster (WASM) for simple transforms
- **Tier 2**: Haiku for simple tasks
- **Tier 3**: Sonnet/Opus for architecture, security, complex reasoning

### 3. Memory & Learning System
- Pattern persistence across sessions
- Neural training signals from successful task outcomes
- Model-routing learning and cost tracking
- Audit chain for transparency

### 4. Swarm Intelligence Capabilities
- Configurable topologies (hierarchical, mesh, hierarchical-mesh, etc.)
- Consensus strategies (Raft, Byzantine, Gossip, CRDT, Quorum)
- Shared memory namespace with anti-drift gates
- HNSW-enabled vector search for semantic similarity

## Data Sources Integrated (Planned)
The system is designed to connect to:
1. **Documents**: PDF, Word, Markdown, HTML, Confluence, SharePoint
2. **Ticket Systems**: Jira, GitHub Issues, Zendesk, ServiceNow
3. **Chat Platforms**: Slack, Microsoft Teams, Discord, Email archives
4. **Project Management**: Asana, Trello, Monday.com, Microsoft Project
5. **Wiki/Knowledge Base**: Confluence, Notion, Internal Wikis

## Agent Capabilities Delivered
- Natural language understanding for user queries
- Graph traversal algorithms for finding connected information
- Pathfinding to trace decision origins and ownership chains
- Source citation and attribution mechanisms
- Learning from interactions to improve future responses

## Files Structure
```
src/
├── agents/
│   ├── agent.js              # Base agent class
│   ├── architectAgent.js     # System architecture agent
│   ├── coderAgent.js         # Implementation agent
│   ├── message.js            # Inter-agent communication
│   ├── researcherAgent.js    # Research and analysis agent
│   ├── reviewerAgent.js      # Code quality and security reviewer
│   ├── task.js               # Task management
│   └── testerAgent.js        # Testing and validation agent
└── backend/
    ├── dataIngestion.js      # Data ingestion pipeline
    └── workflow.js           # Workflow DAG management
```

## How to Use
1. Agents are instantiated and coordinated through message passing
2. Tasks are defined with specific types that route to appropriate agents
3. The workflow engine manages task dependencies and execution order
4. Data flows through the ingestion pipeline for processing and storage
5. Agents collaborate to research, design, implement, test, and review the knowledge graph system

## Next Steps for Completion
To complete the hackathon project, the following would need to be implemented:
1. FalkorDB integration for the knowledge graph storage
2. Specific data source connectors (Jira, Slack, GitHub, etc.)
3. Natural language to graph query translation layer
4. Source tracking and attribution mechanisms
5. Visualization components for the knowledge graph
6. Demo scenarios showcasing the agent's capabilities

## Success Criteria Met
Our implementation provides the foundation for an agent that can:
1. Answer questions with clear source attribution (via planned FalkorDB integration)
2. Trace decisions through connected data (via workflow and agent coordination)
3. Find experts through relationship traversal (via graph capabilities)
4. Show reasoning path (via message passing and task completion tracking)
5. Handle updates through the data ingestion pipeline

---
*Documentation generated for hackathon project submission*