// Task Node implementation for workflow processing
class Task {
  constructor(id, type, payload, dependencies = [], options = {}) {
    this.id = id;
    this.type = type;
    this.payload = payload;
    this.dependencies = dependencies; // Array of task IDs this task depends on
    this.options = options;

    this.status = 'pending'; // pending, ready, running, completed, failed, cancelled
    this.assignedAgent = null;
    this.result = null;
    this.error = null;
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
    this.retryCount = 0;
    this.maxRetries = options.maxRetries || 3;

    // Validate task
    this.validate();
  }

  // Validate task properties
  validate() {
    if (!this.id) throw new Error('Task must have an ID');
    if (!this.type) throw new Error('Task must have a type');
    if (!this.payload) throw new Error('Task must have payload');
    if (!Array.isArray(this.dependencies)) throw new Error('Dependencies must be an array');
  }

  // Check if dependencies are satisfied
  areDependenciesSatisfied(completedTaskIds) {
    return this.dependencies.every(depId => completedTaskIds.includes(depId));
  }

  // Mark task as ready (dependencies satisfied)
  markReady() {
    if (this.status === 'pending') {
      this.status = 'ready';
    }
  }

  // Mark task as running
  markRunning(agentId) {
    this.status = 'running';
    this.assignedAgent = agentId;
    this.startedAt = new Date().toISOString();
  }

  // Mark task as completed
  markCompleted(result) {
    this.status = 'completed';
    this.result = result;
    this.completedAt = new Date().toISOString();
  }

  // Mark task as failed
  markFailed(error) {
    this.status = 'failed';
    this.error = error;
    this.completedAt = new Date().toISOString();

    // Increment retry count for potential retry
    this.retryCount++;
  }

  // Check if task can be retried
  canRetry() {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  }

  // Reset task for retry
  resetForRetry() {
    if (this.canRetry()) {
      this.status = 'pending';
      this.assignedAgent = null;
      this.error = null;
      this.startedAt = null;
      this.completedAt = null;
    }
  }

  // Cancel task
  cancel() {
    this.status = 'cancelled';
    this.completedAt = new Date().toISOString();
  }

  // Get task duration in milliseconds
  getDuration() {
    if (!this.startedAt || !this.completedAt) return null;
    return new Date(this.completedAt).getTime() - new Date(this.startedAt).getTime();
  }

  // Serialize task for storage/transmission
  serialize() {
    return JSON.stringify({
      id: this.id,
      type: this.type,
      payload: this.payload,
      dependencies: this.dependencies,
      options: this.options,
      status: this.status,
      assignedAgent: this.assignedAgent,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    });
  }

  // Deserialize task from storage/transmission
  static deserialize(data) {
    const obj = JSON.parse(data);
    const task = new Task(
      obj.id,
      obj.type,
      obj.payload,
      obj.dependencies,
      obj.options
    );
    task.status = obj.status;
    task.assignedAgent = obj.assignedAgent;
    task.result = obj.result;
    task.error = obj.error;
    task.createdAt = obj.createdAt;
    task.startedAt = obj.startedAt;
    task.completedAt = obj.completedAt;
    task.retryCount = obj.retryCount;
    task.maxRetries = obj.maxRetries;
    return task;
  }
}

module.exports = { Task };