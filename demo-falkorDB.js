// Demonstration of FalkorDB Knowledge Graph Integration
// This script shows how to use the FalkorDB storage system

const { FalkorDBStorage } = require('./src/backend/falkorDB');
const { DataIngestionPipeline } = require('./src/backend/dataIngestion');
const { Workflow, Task, Message } = require('./src/backend/workflow');

async function demoFalkorDBStorage() {
  console.log('=== FalkorDB Storage Demo ===\n');

  // Create FalkorDB storage instance
  const storage = new FalkorDBStorage({
    host: 'localhost',
    port: 6379,
    databaseName: 'company_demo'
  });

  try {
    // Connect to FalkorDB
    console.log('1. Connecting to FalkorDB...');
    await storage.connect();
    console.log('   Connected successfully!\n');

    // Create some nodes
    console.log('2. Creating knowledge graph nodes...');
    const companyNode = await storage.createNode('Company', {
      name: 'Acme Corporation',
      founded: 2020,
      industry: 'Technology',
      employees: 150
    });

    const personNode = await storage.createNode('Person', {
      name: 'John Doe',
      role: 'Software Engineer',
      department: 'Engineering',
      hireDate: '2023-01-15'
    });

    const projectNode = await storage.createNode('Project', {
      name: 'Knowledge Graph Initiative',
      startDate: '2024-01-01',
      status: 'Active',
      budget: 250000
    });

    console.log(`   Created Company node: ${companyNode.id}`);
    console.log(`   Created Person node: ${personNode.id}`);
    console.log(`   Created Project node: ${projectNode.id}\n`);

    // Create relationships
    console.log('3. Creating relationships between nodes...');
    const worksFor = await storage.createRelationship(
      personNode.id,
      companyNode.id,
      'WORKS_FOR',
      {
        position: 'Software Engineer',
        startDate: '2023-01-15',
        salary: 95000
      }
    );

    const uses = await storage.createRelationship(
      personNode.id,
      projectNode.id,
      'USES',
      {
        role: 'Lead Developer',
        contribution: 'Architecture and implementation'
      }
    );

    const partOf = await storage.createRelationship(
      projectNode.id,
      companyNode.id,
      'PART_OF',
      {
        initiative: 'Digital Transformation',
        priority: 'High'
      }
    );

    console.log(`   Created WORKS_FOR relationship: ${worksFor.id}`);
    console.log(`   Created USES relationship: ${uses.id}`);
    console.log(`   Created PART_OF relationship: ${partOf.id}\n`);

    // Query the knowledge graph
    console.log('4. Querying the knowledge graph...');

    // Find all companies
    const companies = await storage.findNodesByLabelAndProperties('Company');
    console.log(`   Found ${companies.length} company nodes:`);
    companies.forEach(company => {
      console.log(`     - ${company.properties.name} (${company.properties.employees} employees)`);
    });

    // Find all persons
    const persons = await storage.findNodesByLabelAndProperties('Person');
    console.log(`   Found ${persons.length} person nodes:`);
    persons.forEach(person => {
      console.log(`     - ${person.properties.name} (${person.properties.role})`);
    });

    // Traverse the graph
    console.log('\n5. Traversing the knowledge graph...');
    const traversalPath = await storage.traverse(personNode.id, null, 'both', 2);
    console.log(`   Traversal path from ${personNode.id} (Person) has ${traversalPath.length} nodes:`);
    traversalPath.forEach((step, index) => {
      const indent = '  '.repeat(step.depth);
      if (step.depth === 0) {
        console.log(`${indent}${step.node.properties.name} (${step.node.label}) - START`);
      } else {
        const relType = step.relationship ? step.relationship.type : 'unknown';
        console.log(`${indent}${step.node.properties.name} (${step.node.label}) - via ${relType}`);
      }
    });

    // Get statistics
    console.log('\n6. Getting graph statistics...');
    const stats = await storage.getStats();
    console.log(`   Database: ${stats.database}`);
    console.log(`   Nodes: ${stats.nodeCount}`);
    console.log(`   Relationships: ${stats.relationshipCount}`);
    console.log(`   Size on disk: ${stats.sizeOnDisk} MB`);
    console.log(`   Last updated: ${stats.lastUpdated}\n`);

  } catch (error) {
    console.error(`Error in FalkorDB demo: ${error.message}`);
  } finally {
    // Clean up
    try {
      await storage.disconnect();
      console.log('7. Disconnected from FalkorDB');
    } catch (error) {
      console.error(`Error disconnecting: ${error.message}`);
    }
  }
}

async function demoDataIngestionWithFalkorDB() {
  console.log('=== Data Ingestion Pipeline with FalkorDB Demo ===\n');

  // Create a data ingestion pipeline configured to use FalkorDB
  const pipeline = new DataIngestionPipeline({
    batchSize: 10,
    maxRetries: 3,
    continueOnError: true,
    storageType: 'falkordb',
    falkorDBConfig: {
      host: 'localhost',
      port: 6379,
      databaseName: 'data_pipeline_demo'
    },
    pipelineId: 'demo_pipeline_001',
    nodeLabel: 'ProcessedDataItem',
    createSequenceRelationships: true
  });

  try {
    // Initialize the pipeline
    console.log('1. Initializing data ingestion pipeline...');
    await pipeline.initialize();
    console.log('   Pipeline initialized successfully!\n');

    // Sample data to process
    const sampleData = [
      { id: 1, name: 'Alice Smith', role: 'Data Analyst', department: 'Analytics', value: 95 },
      { id: 2, name: 'Bob Johnson', role: 'Software Engineer', department: 'Engineering', value: 87 },
      { id: 3, name: 'Carol Williams', role: 'Product Manager', department: 'Product', value: 92 },
      { id: 4, name: 'David Brown', role: 'DevOps Engineer', department: 'Operations', value: 78 },
      { id: 5, name: 'Eve Davis', role: 'UX Designer', department: 'Design', value: 88 }
    ];

    console.log('2. Processing sample data through pipeline...');
    console.log(`   Input data: ${sampleData.length} items`);

    // Process the data
    const processedData = await pipeline.process(sampleData);

    console.log(`   Output data: ${Array.isArray(processedData) ? processedData.length : 1} items\n`);

    // Check pipeline status
    console.log('3. Checking pipeline status...');
    const status = pipeline.getStatus();
    console.log(`   Pipeline initialized: ${status.isInitialized}`);
    console.log(`   Storage type: ${status.storageType}`);
    if (status.falkorDB) {
      console.log(`   FalkorDB connected: ${status.falkorDB.isConnected}`);
      console.log(`   FalkorDB database: ${status.falkorDB.database}`);
    }
    console.log(`   Memory storage items: ${status.memoryStorage.itemCount}\n`);

    // Retrieve data from storage
    console.log('4. Retrieving stored data from FalkorDB...');
    const retrievedData = await pipeline.retrieveData({
      limit: 10
    });

    console.log(`   Retrieved ${retrievedData.length} items from storage:`);
    retrievedData.forEach((item, index) => {
      console.log(`     ${index + 1}. ${JSON.stringify(item)}`);
    });

  } catch (error) {
    console.error(`Error in data ingestion demo: ${error.message}`);
  } finally {
    // Clean up
    try {
      await pipeline.shutdown();
      console.log('\n5. Pipeline shut down successfully');
    } catch (error) {
      console.error(`Error shutting down pipeline: ${error.message}`);
    }
  }
}

async function demoWorkflowIntegration() {
  console.log('=== Workflow Integration Demo ===\n');

  try {
    // Create a workflow
    const workflow = new Workflow(
      'wf_demo_001',
      'Data Processing Workflow',
      'A sample workflow that demonstrates task dependencies'
    );

    // Create tasks
    const extractTask = new Workflow.Task(
      'extract_001',
      'data-extraction',
      { source: 'company_db', query: 'SELECT * FROM employees LIMIT 100' },
      []
    );

    const transformTask = new Workflow.Task(
      'transform_001',
      'data-transformation',
      { operations: ['clean', 'normalize', 'enrich'] },
      ['extract_001'] // Depends on extract task
    );

    const loadTask = new Workflow.Task(
      'load_001',
      'data-loading',
      { destination: 'data_warehouse', format: 'parquet' },
      ['transform_001'] // Depends on transform task
    );

    const notifyTask = new Workflow.Task(
      'notify_001',
      'notification',
      { message: 'Data pipeline completed successfully', channel: 'slack' },
      ['load_001'] // Depends on load task
    );

    // Add tasks to workflow
    workflow.addTask(extractTask);
    workflow.addTask(transformTask);
    workflow.addTask(loadTask);
    workflow.addTask(notifyTask);

    console.log('1. Created workflow with 4 tasks:');
    console.log(`   - ${extractTask.type} (${extractTask.id})`);
    console.log(`   - ${transformTask.type} (${transformTask.id}) -> depends on extract`);
    console.log(`   - ${loadTask.type} (${loadTask.id}) -> depends on transform`);
    console.log(`   - ${notifyTask.type} (${notifyTask.id}) -> depends on load\n`);

    // Check workflow status
    const status = workflow.getStatus();
    console.log('2. Initial workflow status:');
    console.log(`   - Status: ${status.status}`);
    console.log(`   - Total tasks: ${status.totalTasks}`);
    console.log(`   - Pending tasks: ${status.taskCounts.pending}\n`);

    // Get ready tasks
    const readyTasks = workflow.getReadyTasks();
    console.log('3. Ready tasks to execute:');
    readyTasks.forEach(task => {
      console.log(`   - ${task.type} (${task.id})`);
    });
    console.log(`   Total ready: ${readyTasks.length}\n`);

    // Show workflow definition
    console.log('4. Workflow definition:');
    const definition = workflow.getDefinition();
    console.log(`   ID: ${definition.id}`);
    console.log(`   Name: ${definition.name}`);
    console.log(`   Description: ${definition.description}`);
    console.log(`   Tasks: ${definition.tasks.length}`);
    console.log(`   Dependencies: ${definition.dependencies.length}\n`);

  } catch (error) {
    console.error(`Error in workflow demo: ${error.message}`);
  }
}

// Run all demos
async function runAllDemos() {
  console.log('🚀 Starting FalkorDB Integration Demonstrations\n');
  console.log('='.repeat(60));

  await demoFalkorDBStorage();
  console.log('\n' + '='.repeat(60) + '\n');

  await demoDataIngestionWithFalkorDB();
  console.log('\n' + '='.repeat(60) + '\n');

  await demoWorkflowIntegration();
  console.log('\n' + '='.repeat(60));
  console.log('🎉 All demonstrations completed!');
}

// Run the demos if this script is executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

module.exports = {
  demoFalkorDBStorage,
  demoDataIngestionWithFalkorDB,
  demoWorkflowIntegration
};