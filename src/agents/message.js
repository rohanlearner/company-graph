// Message Edge implementation for agent communication in hierarchical-mesh topology
class Message {
  constructor(fromAgentId, toAgentId, type, payload, options = {}) {
    this.id = this.generateId();
    this.from = fromAgentId;
    this.to = toAgentId;
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

module.exports = { Message };