// Data Ingestion Pipeline Module with FalkorDB Integration
const FalkorDBStorage = require('./falkorDB');

class DataIngestionPipeline {
  constructor(config = {}) {
    this.config = {
      batchSize: config.batchSize || 100,
      maxRetries: config.maxRetries || 3,
      continueOnError: config.continueOnError || true,
      storageType: config.storageType || 'memory', // memory, falkordb, hybrid
      ...config
    };

    this.stages = [];
    this.processors = new Map();
    this.filters = new Map();
    this.transformers = new Map();
    this.isInitialized = false;

    // Initialize FalkorDB storage if needed
    if (this.config.storageType === 'falkordb' || this.config.storageType === 'hybrid') {
      this.falkorDB = new FalkorDBStorage(config.falkorDBConfig || {});
    } else {
      this.falkorDB = null;
    }

    // In-memory storage for fallback
    this.memoryStorage = new Map();
  }

  // Register a processor
  registerProcessor(name, processorFn) {
    this.processors.set(name, processorFn);
  }

  // Register a filter
  registerFilter(name, filterFn) {
    this.filters.set(name, filterFn);
  }

  // Register a transformer
  registerTransformer(name, transformerFn) {
    this.transformers.set(name, transformerFn);
  }

  // Add a stage to the pipeline
  addStage(stageName, options = {}) {
    this.stages.push({
      name: stageName,
      enabled: options.enabled !== undefined ? options.enabled : true,
      processors: [],
      filters: [],
      transformers: []
    });
  }

  // Add processor to a stage
  addProcessorToStage(stageName, processorName) {
    const stage = this.stages.find(s => s.name === stageName);
    if (stage) {
      stage.processors.push(processorName);
    }
  }

  // Add filter to a stage
  addFilterToStage(stageName, filterName) {
    const stage = this.stages.find(s => s.name === stageName);
    if (stage) {
      stage.filters.push(filterName);
    }
  }

  // Add transformer to a stage
  addTransformerToStage(stageName, transformerName) {
    const stage = this.stages.find(s => s.name === stageName);
    if (stage) {
      stage.transformers.push(transformerName);
    }
  }

  // Process data through the pipeline
  async process(data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [data];
    let currentData = dataArray;

    // Process each stage
    for (const stage of this.stages) {
      if (!stage.enabled) continue;

      // Processors
      for (const processorName of stage.processors) {
        const processor = this.processors.get(processorName);
        if (processor) {
          try {
            currentData = await Promise.all(
              currentData.map(item => processor(item))
            );
          } catch (error) {
            if (!this.continueOnError) {
              throw new Error(`Processor ${processorName} failed: ${error.message}`);
            }
            console.error(`Processor ${processorName} failed: ${error.message}`);
          }
        }
      }

      // Filters
      for (const filterName of stage.filters) {
        const filter = this.filters.get(filterName);
        if (filter) {
          try {
            currentData = await Promise.all(
              currentData.map(item => filter(item))
            ).then(filtered => filtered.filter(item => item !== false && item !== null));
          } catch (error) {
            if (!this.continueOnError) {
              throw new Error(`Filter ${filterName} failed: ${error.message}`);
            }
            console.error(`Filter ${filterName} failed: ${error.message}`);
          }
        }
      }

      // Transformers
      for (const transformerName of stage.transformers) {
        const transformer = this.transformers.get(transformerName);
        if (transformer) {
          try {
            currentData = await Promise.all(
              currentData.map(item => transformer(item))
            );
          } catch (error) {
            if (!this.continueOnError) {
              throw new Error(`Transformer ${transformerName} failed: ${error.message}`);
            }
            console.error(`Transformer ${transformerName} failed: ${error.message}`);
          }
        }
      }
    }

    // Store results based on storage configuration
    await this.storeResults(currentData);

    return Array.isArray(data) ? currentData : (currentData.length > 0 ? currentData[0] : null);
  }

  // Store results based on configuration
  async storeResults(data) {
    if (this.config.storageType === 'falkordb' && this.falkorDB) {
      // Store in FalkorDB
      await this.storeInFalkorDB(data);
    } else if (this.config.storageType === 'hybrid' && this.falkorDB) {
      // Store in both FalkorDB and memory
      await this.storeInFalkorDB(data);
      this.storeInMemory(data);
    } else {
      // Store in memory only (default)
      this.storeInMemory(data);
    }
  }

  // Store data in FalkorDB
  async storeInFalkorDB(data) {
    if (!this.falkorDB || !this.falkorDB.isConnected) {
      // Try to connect if not connected
      if (this.falkorDB) {
        await this.falkorDB.connect();
      }
    }

    if (this.falkorDB && this.falkorDB.isConnected) {
      try {
        // Store each data item as a node in the knowledge graph
        for (const [index, item] of data.entries()) {
          // Determine node label based on item type or config
          const label = this.config.nodeLabel || 'DataItem';

          // Create node in FalkorDB
          const node = await this.falkorDB.createNode(label, {
            pipelineId: this.config.pipelineId || `pipeline_${Date.now()}`,
            batchIndex: index,
            storedAt: new Date().toISOString(),
            ...(typeof item === 'object' && item !== null ? item : { value: item })
          });

          // Optionally create relationships to previous item
          if (index > 0 && this.config.createSequenceRelationships) {
            // In a real implementation, we would keep track of previous node ID
            // For simulation, we'll skip this
          }
        }

        console.log(`Stored ${data.length} items in FalkorDB`);
      } catch (error) {
        console.error(`Failed to store data in FalkorDB: ${error.message}`);
        // Depending on configuration, we might want to fallback to memory
        if (this.config.storageType === 'falkordb') {
          throw error; // Re-throw if FalkorDB is required
        }
        // Fallback to memory for hybrid or if continuing on error
        if (this.config.continueOnError || this.config.storageType === 'hybrid') {
          this.storeInMemory(data);
        }
      }
    }
  }

  // Store data in memory
  storeInMemory(data) {
    const storageKey = `pipeline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.memoryStorage.set(storageKey, {
      data: data,
      storedAt: new Date().toISOString(),
      count: data.length
    });

    // Limit memory storage size
    if (this.memoryStorage.size > 100) {
      // Remove oldest entries
      const keys = Array.from(this.memoryStorage.keys());
      const keysToRemove = keys.slice(0, keys.length - 100);
      for (const key of keysToRemove) {
        this.memoryStorage.delete(key);
      }
    }

    console.log(`Stored ${data.length} items in memory (key: ${storageKey})`);
  }

  // Retrieve data from storage
  async retrieveData(queryParams = {}) {
    if (this.config.storageType === 'falkordb' && this.falkorDB) {
      // Retrieve from FalkorDB
      return await this.retrieveFromFalkorDB(queryParams);
    } else if (this.config.storageType === 'hybrid' && this.falkorDB) {
      // Try FalkorDB first, fallback to memory
      try {
        return await this.retrieveFromFalkorDB(queryParams);
      } catch (error) {
        console.warn(`FalkorDB retrieval failed, falling back to memory: ${error.message}`);
        return this.retrieveFromMemory(queryParams);
      }
    } else {
      // Retrieve from memory only
      return this.retrieveFromMemory(queryParams);
    }
  }

  // Retrieve data from FalkorDB
  async retrieveFromFalkorDB(queryParams = {}) {
    if (!this.falkorDB || !this.falkorDB.isConnected) {
      await this.falkorDB.connect();
    }

    if (this.falkorDB && this.falkorDB.isConnected) {
      try {
        // Build query based on parameters
        let query = 'MATCH (n:DataItem)';
        const params = {};

        if (queryParams.pipelineId) {
          query += ' WHERE n.pipelineId = $pipelineId';
          params.pipelineId = queryParams.pipelineId;
        }

        if (queryParams.limit) {
          query += ' LIMIT $limit';
          params.limit = queryParams.limit;
        }

        query += ' RETURN n';

        // Execute query
        const results = await this.falkorDB.query(query, params);

        // Extract data from results
        const data = results.map(result => {
          if (result.node && result.node.properties) {
            const props = { ...result.node.properties };
            // Remove metadata fields if desired
            delete props.pipelineId;
            delete props.batchIndex;
            delete props.storedAt;
            return props;
          }
          return result;
        });

        console.log(`Retrieved ${data.length} items from FalkorDB`);
        return data;
      } catch (error) {
        console.error(`Failed to retrieve data from FalkorDB: ${error.message}`);
        throw error;
      }
    }

    return [];
  }

  // Retrieve data from memory
  retrieveFromMemory(queryParams = {}) {
    let results = [];

    for (const [key, value] of this.memoryStorage.entries()) {
      const itemData = value.data || [];

      // Apply filters if provided
      let filteredData = itemData;
      if (queryParams.filters && typeof queryParams.filters === 'function') {
        filteredData = itemData.filter(queryParams.filters);
      }

      // Apply limit if provided
      if (queryParams.limit && typeof queryParams.limit === 'number') {
        filteredData = filteredData.slice(0, queryParams.limit);
      }

      results = [...results, ...filteredData];
    }

    // Sort by storage time if requested
    if (queryParams.sortBy === 'storedAt') {
      // In a real implementation, we would sort by actual storage time
      // For now, we'll just return as is
    }

    console.log(`Retrieved ${results.length} items from memory`);
    return results;
  }

  // Initialize the pipeline and storage
  async initialize() {
    // Initialize FalkorDB if configured
    if (this.falkorDB) {
      await this.falkorDB.connect();
    }

    this.isInitialized = true;
    return this.isInitialized;
  }

  // Shutdown the pipeline and storage
  async shutdown() {
    // Disconnect FalkorDB if connected
    if (this.falkorDB && this.falkorDB.isConnected) {
      await this.falkorDB.disconnect();
    }

    // Clear memory storage
    this.memoryStorage.clear();

    this.isInitialized = false;
    return !this.isInitialized;
  }

  // Get pipeline status including storage info
  getStatus() {
    const baseStatus = {
      isInitialized: this.isInitialized,
      stages: this.stages.map(s => ({
        name: s.name,
        enabled: s.enabled,
        processorCount: s.processors.length,
        filterCount: s.filters.length,
        transformerCount: s.transformers.length
      })),
      totalProcessors: this.processors.size,
      totalFilters: this.filters.size,
      totalTransformers: this.transformers.size,
      storageType: this.config.storageType
    };

    // Add FalkorDB status if configured
    if (this.falkorDB) {
      baseStatus.falkorDB = {
        isConnected: this.falkorDB ? this.falkorDB.isConnected : false,
        host: this.falkorDB ? this.falkorDB.host : null,
        port: this.falkorDB ? this.falkorDB.port : null,
        database: this.falkorDB ? this.falkorDB.databaseName : null
      };
    }

    // Add memory storage stats
    baseStatus.memoryStorage = {
      itemCount: this.memoryStorage.size,
      totalItems: Array.from(this.memoryStorage.values()).reduce((sum, item) => sum + (item.data ? item.data.length : 0), 0)
    };

    return baseStatus;
  }
}

module.exports = { DataIngestionPipeline };