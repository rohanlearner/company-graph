// Workflow Management Module
class Workflow {
  constructor(id, name, description = '') {
    this.id = id || `workflow_${Date.now()}`;
    this.name = name || 'Unnamed Workflow';
    this.description = description || '';
    this.tasks = new Map(); // taskId -> Task
    this.dependencies = new Map(); // taskId -> Set of dependent taskIds
    this.reverseDependencies = new Map(); // taskId -> Set of taskIds that depend on this task
    this.status = 'created'; // created, running, completed, failed, cancelled
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
    this.executionResults = new Map(); // taskId -> result
  }

  // Add a task to the workflow
  addTask(task) {
    if (!(task instanceof Task)) {
      throw new Error('Only Task instances can be added to a workflow');
    }

    this.tasks.set(task.id, task);
    this.dependencies.set(task.id, new Set());
    this.reverseDependencies.set(task.id, new Set());

    return this;
  }

  // Add a dependency between tasks
  addDependency(fromTaskId, toTaskId) {
    if (!this.tasks.has(fromTaskId)) {
      throw new Error(`Source task ${fromTaskId} not found in workflow`);
    }

    if (!this.tasks.has(toTaskId)) {
      throw new Error(`Target task ${toTaskId} not found in workflow`);
    }

    // Check for circular dependencies
    if (this.wouldCreateCycle(fromTaskId, toTaskId)) {
      throw new Error(`Adding dependency ${fromTaskId} -> ${toTaskId} would create a circular dependency`);
    }

    // Add the dependency
    this.dependencies.get(toTaskId).add(fromTaskId);
    this.reverseDependencies.get(fromTaskId).add(toTaskId);

    return this;
  }

  // Check if adding a dependency would create a cycle
  wouldCreateCycle(fromTaskId, toTaskId) {
    // Simple cycle detection: check if there's already a path from toTaskId to fromTaskId
    const visited = new Set();
    const queue = [toTaskId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (currentId === fromTaskId) {
        return true; // Found a path from toTaskId to fromTaskId, so adding the reverse would create a cycle
      }

      if (!visited.has(currentId)) {
        visited.add(currentId);
        // Add all tasks that depend on currentId (reverse dependencies)
        for (const dependentId of this.reverseDependencies.get(currentId) || []) {
          if (!visited.has(dependentId)) {
            queue.push(dependentId);
          }
        }
      }
    }

    return false; // No cycle would be created
  }

  // Get tasks that are ready to execute (no unmet dependencies)
  getReadyTasks() {
    const readyTasks = [];

    for (const [taskId, task] of this.tasks.entries()) {
      const dependencies = this.dependencies.get(taskId) || new Set();
      const unmetDependencies = Array.from(dependencies).filter(
        depId => this.executionResults.has(depId) === false && this.tasks.get(depId).status !== 'completed'
      );

      if (unmetDependencies.length === 0 && task.status === 'pending') {
        readyTasks.push(task);
      }
    }

    return readyTasks;
  }

  // Get workflow status
  getStatus() {
    const taskCounts = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    for (const task of this.tasks.values()) {
      if (taskCounts[task.status] !== undefined) {
        taskCounts[task.status]++;
      }
    }

    let overallStatus = this.status;
    if (this.status === 'created') {
      if (taskCounts.pending > 0) {
        overallStatus = 'ready';
      }
    } else if (this.status === 'running') {
      if (taskCounts.completed === this.tasks.size) {
        overallStatus = 'completed';
      } else if (taskCounts.failed > 0) {
        overallStatus = 'failed';
      }
    }

    return {
      workflowId: this.id,
      workflowName: this.name,
      status: overallStatus,
      taskCounts: taskCounts,
      totalTasks: this.tasks.size,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.startedAt && this.completedAt
        ? new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime()
        : this.startedAt
          ? Date.now() - new Date(this.startedAt).getTime()
          : null
    };
  }

  // Start workflow execution
  async startExecution(agentFactory) {
    if (this.status !== 'created' && this.status !== 'ready') {
      throw new Error(`Workflow cannot be started from status: ${this.status}`);
    }

    this.status = 'running';
    this.startedAt = new Date().toISOString();

    try {
      // Execute tasks as they become ready
      while (this.status === 'running') {
        const readyTasks = this.getReadyTasks();

        if (readyTasks.length === 0) {
          // Check if all tasks are completed
          const allCompleted = Array.from(this.tasks.values()).every(
            task => task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled'
          );

          if (allCompleted) {
            this.status = 'completed';
            this.completedAt = new Date().toISOString();
            break;
          }

          // No ready tasks but not all completed - might be waiting for external events
          // In a real implementation, we would wait or check for external triggers
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        // Execute ready tasks in parallel
        const executionPromises = readyTasks.map(async (task) => {
          try {
            task.status = 'running';
            // Create an agent to execute this task
            const agent = agentFactory.createAgent(task.type);
            const result = await agent.executeTask(task.payload);
            task.status = 'completed';
            this.executionResults.set(task.id, result);
            return { taskId: task.id, status: 'completed', result };
          } catch (error) {
            task.status = 'failed';
            this.executionResults.set(task.id, { error: error.message });
            return { taskId: task.id, status: 'failed', error: error.message };
          }
        });

        // Wait for all tasks to complete
        await Promise.all(executionPromises);
      }
    } catch (error) {
      this.status = 'failed';
      this.completedAt = new Date().toISOString();
      throw error;
    }

    return this.getStatus();
  }

  // Cancel workflow execution
  cancel() {
    if (this.status === 'running') {
      this.status = 'cancelled';
      this.completedAt = new Date().toISOString();
    }
    return this.getStatus();
  }

  // Get workflow definition (for serialization)
  getDefinition() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      tasks: Array.from(this.tasks.values()).map(task => ({
        id: task.id,
        type: task.type,
        payload: task.payload,
        dependencies: Array.from(task.dependencies || []),
        status: task.status
      })),
      dependencies: Array.from(this.dependencies.entries()).map(([toId, fromIds]) => ({
        from: Array.from(fromIds),
        to: toId
      }))
    };
  }
}

// Task class for workflow processing
class Task {
  constructor(id, type, payload = {}, dependencies = [], options = {}) {
    this.id = id || `task_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.type = type || 'unspecified';
    this.payload = payload || {};
    this.dependencies = dependencies || [];
    this.options = options || {};
    this.status = 'pending'; // pending, ready, running, completed, failed, cancelled
    this.result = null;
    this.error = null;
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
  }

  // Check if all dependencies are satisfied
  areDependenciesMet(completedTaskIds) {
    return this.dependencies.every(depId => completedTaskIds.includes(depId));
  }

  // Get task status
  getStatus() {
    return {
      taskId: this.id,
      taskType: this.type,
      status: this.status,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.startedAt && this.completedAt
        ? new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime()
        : this.startedAt
          ? Date.now() - new Date(this.startedAt).getTime()
          : null,
      result: this.result,
      error: this.error
    };
  }
}

// Message class for workflow communication (simplified)
class Message {
  constructor(fromTaskId, toTaskId, type, payload, options = {}) {
    this.id = this.generateId();
    this.from = fromTaskId;
    this.to = toTaskId;
    this.type = type; // e.g., 'task-assignment', 'task-result', 'query', 'response'
    this.payload = payload;
    this.timestamp = new Date().toISOString();
    this.correlationId = options.correlationId || null;
    this.priority = options.priority || 'normal'; // low, normal, high, critical
    this.ttl = options.ttl || 300000; // 5 minutes default TTL
    this.attempts = 0;
    this.maxAttempts = options.maxAttempts || 3;
  }

  // Generate unique message ID
  generateId() {
    return 'msg_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Check if message has expired
  isExpired() {
    const age = Date.now() - new Date(this.timestamp).getTime();
    return age > this.ttl;
  }

  // Increment attempt counter
  incrementAttempt() {
    this.attempts++;
  }

  // Check if message can be retried
  canRetry() {
    return this.attempts < this.maxAttempts && !this.isExpired();
  }

  // Serialize message for transmission
  serialize() {
    return JSON.stringify({
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      payload: this.payload,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      priority: this.priority,
      ttl: this.ttl,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts
    });
  }

  // Deserialize message from transmission
  static deserialize(data) {
    const obj = JSON.parse(data);
    const message = new Message(
      obj.from,
      obj.to,
      obj.type,
      obj.payload,
      {
        correlationId: obj.correlationId,
        priority: obj.priority,
        ttl: obj.ttl,
        maxAttempts: obj.maxAttempts
      }
    );
    message.id = obj.id;
    message.timestamp = obj.timestamp;
    message.attempts = obj.attempts;
    return message;
  }
}

module.exports = { Workflow, Task, Message };