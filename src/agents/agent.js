// Base Agent class providing common functionality for all specialized agents
const { Message } = require('./message');

class Agent {
  constructor(id, type, capabilities = [], config = {}) {
    this.id = id;
    this.type = type;
    this.capabilities = capabilities;
    this.config = config;
    this.taskQueue = [];
    this.neighbors = []; // For agent communication in hierarchical-mesh topology
    this.status = 'idle'; // idle, busy, processing
    this.messageLog = [];
  }

  // Add a neighbor agent for communication (hierarchical-mesh topology)
  addNeighbor(agent) {
    if (!this.neighbors.includes(agent)) {
      this.neighbors.push(agent);
    }
  }

  // Send a message to another agent
  sendMessage(toAgentId, type, payload, options = {}) {
    const message = new Message(this.id, toAgentId, type, payload, options);

    // Find the neighbor agent
    const neighbor = this.neighbors.find(agent => agent.id === toAgentId);
    if (neighbor) {
      neighbor.receiveMessage(message);
      this.logMessageSent(message);
      return true;
    }

    console.warn(`Could not send message to ${toAgentId}: agent not found in neighbors`);
    return false;
  }

  // Receive a message from another agent
  receiveMessage(message) {
    this.messageLog.push(message);
    this.logMessageReceived(message);
    // In a real implementation, this would trigger task processing
    return message;
  }

  // Log message sent (for debugging/auditing)
  logMessageSent(message) {
    console.log(`[${this.type}] Sent message to ${message.to}: ${message.type}`);
  }

  // Log message received (for debugging/auditing)
  logMessageReceived(message) {
    console.log(`[${this.type}] Received message from ${message.from}: ${message.type}`);
  }

  // Process a task (to be implemented by subclasses)
  async processTask(task) {
    throw new Error(`processTask not implemented for agent type: ${this.type}`);
  }

  // Execute a task (wrapper around processTask)
  async executeTask(task) {
    this.status = 'processing';
    try {
      const result = await this.processTask(task);
      this.status = 'idle';
      return result;
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  // Get agent status
  getStatus() {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      capabilities: this.capabilities,
      taskQueueLength: this.taskQueue.length,
      neighborCount: this.neighbors.length
    };
  }
}

module.exports = { Agent };