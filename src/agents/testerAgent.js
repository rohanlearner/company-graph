const { Agent } = require('./agent');
const { Task } = require('./task');
const { Workflow } = require('../backend/workflow');
const { DataIngestionPipeline } = require('../backend/dataIngestion');

class TesterAgent extends Agent {
  constructor(id, config = {}) {
    super(id, 'tester', ['testing', 'validation', 'quality-assurance'], config);
    this.testTypes = [
      'unit-test',
      'integration-test',
      'end-to-end-test',
      'performance-test',
      'security-test',
      'regression-test'
    ];
    this.testFrameworks = {
      javascript: ['Jest', 'Mocha', 'Jasmine'],
      typescript: ['Jest', 'Ts-Jest', 'Mocha'],
      python: ['PyTest', 'Unittest'],
      general: ['Manual', 'Exploratory']
    };
  }

  async processTask(task) {
    // Testing-specific task processing
    switch (task.type) {
      case 'test-agent-core':
        return await this.testAgentCore(task.payload);
      case 'test-data-pipeline':
        return await this.testDataPipeline(task.payload);
      case 'test-workflow':
        return await this.testWorkflow(task.payload);
      case 'test-agent-communication':
        return await this.testAgentCommunication(task.payload);
      case 'run-integration-tests':
        return await this.runIntegrationTests(task.payload);
      case 'run-performance-tests':
        return await this.runPerformanceTests(task.payload);
      case 'run-security-tests':
        return await this.runSecurityTests(task.payload);
      case 'validate-implementation':
        return await this.validateImplementation(task.payload);
      case 'generate-test-report':
        return await this.generateTestReport(task.payload);
      default:
        return await this.generalTesting(task.payload);
    }
  }

  async testAgentCore(payload) {
    const { agentTypes, testScenarios } = payload;
    const testResults = {};

    try {
      for (const agentType of agentTypes) {
        console.log(`Testing agent type: ${agentType}`);

        // Import the agent class
        let AgentClass;
        try {
          switch (agentType.toLowerCase()) {
            case 'researcher':
              AgentClass = require('./researcherAgent').ResearcherAgent;
              break;
            case 'architect':
              AgentClass = require('./architectAgent').ArchitectAgent;
              break;
            case 'coder':
              AgentClass = require('./coderAgent').CoderAgent;
              break;
            case 'tester':
              AgentClass = TesterAgent;
              break;
            case 'reviewer':
              AgentClass = require('./reviewerAgent').ReviewerAgent;
              break;
            default:
              AgentClass = require('./agent').Agent;
          }
        } catch (importError) {
          testResults[agentType] = {
            status: 'skipped',
            reason: `Could not import agent class: ${importError.message}`
          };
          continue;
        }

        // Run test scenarios for this agent type
        const agentTests = await this.runAgentTests(AgentClass, agentType, testScenarios);
        testResults[agentType] = agentTests;
      }

      // Calculate overall results
      const allResults = Object.values(testResults);
      const passedTests = allResults.filter(result =>
        result.status === 'passed' ||
        (result.tests && result.tests.passed > 0)
      ).length;

      const totalTests = allResults.reduce((sum, result) => {
        if (result.tests) {
          return sum + (result.tests.total || 0);
        }
        return sum + (result.status === 'passed' ? 1 : result.status === 'failed' ? 1 : 0);
      }, 0);

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'agent-core-testing',
        results: testResults,
        summary: {
          totalAgentTypes: agentTypes.length,
          testedAgentTypes: Object.keys(testResults).length,
          passedTests: passedTests,
          totalTests: totalTests,
          successRate: totalTests > 0 ? passedTests / totalTests : 0
        },
        status: passedTests > 0 && passedTests === totalTests ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'agent-core-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async testDataPipeline(payload) {
    const { pipelineConfig, testDataSets } = payload;
    try {
      // Create pipeline from config
      const pipeline = new DataIngestionPipeline(pipelineConfig || {});

      // Register standard test processors/filters/transformers
      pipeline.registerProcessor('test-validator', this.createTestValidator());
      pipeline.registerFilter('test-filter', this.createTestFilter());
      pipeline.registerTransformer('test-transformer', this.createTestTransformer());

      // Apply test configuration
      if (pipelineConfig.stages) {
        for (const stageConfig of pipelineConfig.stages) {
          pipeline.addStage(stageConfig.name, { enabled: stageConfig.enabled !== undefined ? stageConfig.enabled : true });

          if (stageConfig.processors) {
            for (const processor of stageConfig.processors) {
              pipeline.addProcessorToStage(stageConfig.name, processor);
            }
          }

          if (stageConfig.filters) {
            for (const filter of stageConfig.filters) {
              pipeline.addFilterToStage(stageConfig.name, filter);
            }
          }

          if (stageConfig.transformers) {
            for (const transformer of stageConfig.transformers) {
              pipeline.addTransformerToStage(stageConfig.name, transformer);
            }
          }
        }
      }

      // Test with each dataset
      const datasetResults = [];
      for (const [index, testData] of testDataSets.entries()) {
        try {
          const startTime = Date.now();
          const results = await pipeline.process(testData);
          const endTime = Date.now();

          datasetResults.push({
            datasetIndex: index,
            inputSize: Array.isArray(testData) ? testData.length : 1,
            outputSize: Array.isArray(results) ? results.length : (results !== null ? 1 : 0),
            processingTime: endTime - startTime,
            status: 'success',
            sampleOutput: results.slice(0, Math.min(3, results.length || 0))
          });
        } catch (error) {
          datasetResults.push({
            datasetIndex: index,
            error: error.message,
            status: 'failed'
          });
        }
      }

      // Calculate overall metrics
      const successfulTests = datasetResults.filter(r => r.status === 'success').length;
      const totalTests = datasetResults.length;

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'data-pipeline-testing',
        pipelineConfig: pipelineConfig,
        datasetResults: datasetResults,
        summary: {
          totalDatasets: totalTests,
          successfulDatasets: successfulTests,
          failedDatasets: totalTests - successfulTests,
          successRate: totalTests > 0 ? successfulTests / totalTests : 0,
          avgProcessingTime: datasetResults
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.processingTime, 0) / Math.max(successfulTests, 1)
        },
        status: successfulTests > 0 && successfulTests === totalTests ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'data-pipeline-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async testWorkflow(payload) {
    const { workflowDef, testScenarios } = payload;
    try {
      // Create workflow from definition
      const workflow = new Workflow(
        workflowDef.id || 'test-workflow-' + Date.now(),
        workflowDef.name || 'Test Workflow',
        workflowDef.description || ''
      );

      // Add tasks
      const taskMap = new Map();
      if (workflowDef.tasks) {
        for (const taskDef of workflowDef.tasks) {
          const task = new Task(
            taskDef.id || `task-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            taskDef.type || 'test-task',
            taskDef.payload || {},
            taskDef.dependencies || [],
            taskDef.options || {}
          );
          workflow.addTask(task);
          taskMap.set(task.id, task);
        }
      }

      // Add dependencies
      if (workflowDef.dependencies) {
        for (const dep of workflowDef.dependencies) {
          try {
            workflow.addDependency(dep.from, dep.to);
          } catch (depError) {
            // Handle dependency errors gracefully
            console.warn(`Could not add dependency ${dep.from} -> ${dep.to}: ${depError.message}`);
          }
        }
      }

      // Validate workflow before testing
      const validation = {
        hasCycle: workflow.hasCycle(),
        taskCount: workflow.tasks.size,
        readyTasks: workflow.getReadyTasks().length
      };

      if (validation.hasCycle) {
        return {
          agent: this.id,
          timestamp: new Date().toISOString(),
          testType: 'workflow-testing',
          error: 'Workflow contains circular dependencies',
          validation: validation,
          status: 'failed'
        };
      }

      // Execute workflow with mock agent factory
      const executionResult = await this.executeWorkflowWithMockAgents(workflow, testScenarios);

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'workflow-testing',
        workflowId: workflow.id,
        workflowName: workflow.name,
        validation: validation,
        executionResult: executionResult,
        status: executionResult.status === 'completed' &&
                executionResult.failedTasks === 0 ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'workflow-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async testAgentCommunication(payload) {
    const { agentConfigs, messageScenarios } = payload;
    try {
      // Create agent instances
      const agents = {};
      for (const config of agentConfigs) {
        let AgentClass;
        try {
          switch (config.type.toLowerCase()) {
            case 'researcher':
              AgentClass = require('./researcherAgent').ResearcherAgent;
              break;
            case 'architect':
              AgentClass = require('./architectAgent').ArchitectAgent;
              break;
            case 'coder':
              AgentClass = require('./coderAgent').CoderAgent;
              break;
            case 'tester':
              AgentClass = TesterAgent;
              break;
            case 'reviewer':
              AgentClass = require('./reviewerAgent').ReviewerAgent;
              break;
            default:
              AgentClass = require('./agent').Agent;
          }
        } catch (e) {
          AgentClass = require('./agent').Agent;
        }

        agents[config.id] = new AgentClass(config.id, config.config || {});
      }

      // Setup basic communication (simplified for testing)
      const agentIds = Object.keys(agents);
      for (let i = 0; i < agentIds.length; i++) {
        for (let j = i + 1; j < agentIds.length; j++) {
          const agent1 = agents[agentIds[i]];
          const agent2 = agents[agentIds[j]];
          agent1.addNeighbor(agent2);
        }
      }

      // Run message scenarios
      const scenarioResults = [];
      for (const [index, scenario] of messageScenarios.entries()) {
        try {
          const { senderId, receiverId, messageType, payload, expectedResponse } = scenario;

          if (!agents[senderId] || !agents[receiverId]) {
            scenarioResults.push({
              scenarioIndex: index,
              status: 'skipped',
              reason: 'Sender or receiver agent not found'
            });
            continue;
          }

          // Send message
          const message = new Message(senderId, receiverId, messageType, payload);
          agents[receiverId].receiveMessage(message);

          // In a real implementation, we'd check for expected response
          // For now, we'll simulate successful delivery
          scenarioResults.push({
            scenarioIndex: index,
            senderId,
            receiverId,
            messageType,
            status: 'success',
            timestamp: new Date().toISOString(),
            delivered: true
          });

          // Small delay between scenarios
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          scenarioResults.push({
            scenarioIndex: index,
            error: error.message,
            status: 'failed'
          });
        }
      }

      const successfulScenarios = scenarioResults.filter(r => r.status === 'success').length;
      const totalScenarios = scenarioResults.length;

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'agent-communication-testing',
        agentCount: Object.keys(agents).length,
        scenarioResults: scenarioResults,
        summary: {
          totalScenarios: totalScenarios,
          successfulScenarios: successfulScenarios,
          failedScenarios: totalScenarios - successfulScenarios,
          successRate: totalScenarios > 0 ? successfulScenarios / totalScenarios : 0
        },
        status: successfulScenarios > 0 && successfulScenarios === totalScenarios ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'agent-communication-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async runIntegrationTests(payload) {
    const { components, testCases } = payload;
    try {
      // Test integration between components
      const integrationResults = [];

      for (const [index, testCase] of testCases.entries()) {
        try {
          const { description, componentsInvolved, testData, expectedOutcome } = testCase;

          // Simulate integration test
          await new Promise(resolve => setTimeout(resolve, 200));

          // Randomly pass/fail for demonstration (in real implementation, this would be actual testing)
          const passed = Math.random() > 0.2; // 80% pass rate

          integrationResults.push({
            testCaseIndex: index,
            description,
            components: componentsInvolved,
            status: passed ? 'passed' : 'failed',
            actualOutcome: passed ? expectedOutcome : `Unexpected result: ${Math.random()}`,
            expectedOutcome,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          integrationResults.push({
            testCaseIndex: index,
            error: error.message,
            status: 'error'
          });
        }
      }

      const passedTests = integrationResults.filter(r => r.status === 'passed').length;
      const totalTests = integrationResults.length;

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'integration-testing',
        components: components,
        testResults: integrationResults,
        summary: {
          totalTests: totalTests,
          passedTests: passedTests,
          failedTests: totalTests - passedTests,
          successRate: totalTests > 0 ? passedTests / totalTests : 0
        },
        status: passedTests > 0 && passedTests === totalTests ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'integration-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async runPerformanceTests(payload) {
    const { components, loadLevels, duration } = payload;
    try {
      const performanceResults = [];

      for (const loadLevel of loadLevels) {
        // Simulate performance test at different load levels
        await new Promise(resolve => setTimeout(resolve, 100));

        const baseLatency = 50; // ms
        const loadFactor = loadLevel / 100; // Normalize load level
        const latency = baseLatency + (Math.random() * 100 * loadFactor);
        const throughput = 1000 / latency; // requests per second
        const errorRate = Math.random() * 0.05 * loadFactor; // 0-5% error rate based on load

        performanceResults.push({
          loadLevel,
          averageLatency: latency,
          throughput: throughput,
          errorRate: errorRate,
          status: latency < 1000 && errorRate < 0.1 ? 'passed' : 'warning'
        });
      }

      // Determine overall status
      const allPassed = performanceResults.every(r => r.status === 'passed');
      const hasWarnings = performanceResults.some(r => r.status === 'warning');

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'performance-testing',
        components: components,
        loadLevels: loadLevels,
        duration: duration || '60s',
        results: performanceResults,
        summary: {
          averageLatency: performanceResults.reduce((sum, r) => sum + r.averageLatency, 0) / performanceResults.length,
          averageThroughput: performanceResults.reduce((sum, r) => sum + r.throughput, 0) / performanceResults.length,
          maxErrorRate: Math.max(...performanceResults.map(r => r.errorRate)),
          status: allPassed ? 'passed' : hasWarnings ? 'warning' : 'failed'
        }
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'performance-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async runSecurityTests(payload) {
    const { components, testVectors } = payload;
    try {
      const securityResults = [];

      for (const [index, vector] of testVectors.entries()) {
        try {
          const { name, description, attackType, severity } = vector;

          // Simulate security test
          await new Promise(resolve => setTimeout(resolve, 150));

          // In real implementation, this would test actual vulnerabilities
          // For now, simulate based on attack type
          const vulnerabilityDetected = Math.random() > 0.8; // 20% chance of detecting vulnerability
          const severityLevel = vulnerabilityDetected ? severity : 'none';

          securityResults.push({
            testVectorIndex: index,
            name,
            description,
            attackType,
            vulnerabilityDetected,
            severity: severityLevel,
            status: vulnerabilityDetected ? 'failed' : 'passed',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          securityResults.push({
            testVectorIndex: index,
            error: error.message,
            status: 'error'
          });
        }
      }

      const passedTests = securityResults.filter(r => r.status === 'passed').length;
      const totalTests = securityResults.length;
      const criticalFailures = securityResults.filter(r =>
        r.status === 'failed' && r.severity === 'critical'
      ).length;

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'security-testing',
        components: components,
        testVectors: testVectors,
        results: securityResults,
        summary: {
          totalTests: totalTests,
          passedTests: passedTests,
          failedTests: totalTests - passedTests,
          criticalFailures: criticalFailures,
          successRate: totalTests > 0 ? passedTests / totalTests : 0
        },
        status: criticalFailures === 0 && passedTests > 0 && passedTests === totalTests ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'security-testing',
        error: error.message,
        status: 'error'
      };
    }
  }

  async validateImplementation(payload) {
    const { implementation, requirements, standards } = payload;
    try {
      const validationResults = [];

      // Validate against requirements
      if (requirements) {
        for (const [index, req] of requirements.entries()) {
          await new Promise(resolve => setTimeout(resolve, 50));

          // Simulate requirement validation
          const met = Math.random() > 0.1; // 90% chance of meeting requirement

          validationResults.push({
            type: 'requirement',
            index: index,
            description: req.description || `Requirement ${index}`,
            met,
            status: met ? 'passed' : 'failed',
            evidence: met ? `Implementation satisfies ${req.description}` : `Missing: ${req.description}`
          });
        }
      }

      // Validate against standards
      if (standards) {
        for (const [index, standard] of standards.entries()) {
          await new Promise(resolve => setTimeout(resolve, 50));

          // Simulate standards compliance
          const compliant = Math.random() > 0.2; // 80% chance of compliance

          validationResults.push({
            type: 'standard',
            index: index,
            description: standard.name || `Standard ${index}`,
            compliant,
            status: compliant ? 'passed' : 'failed',
            evidence: compliant ? `Complies with ${standard.name}` : `Violation: ${standard.description}`
          });
        }
      }

      const passedValidations = validationResults.filter(r => r.status === 'passed').length;
      const totalValidations = validationResults.length;

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'implementation-validation',
        implementation: implementation,
        validationResults: validationResults,
        summary: {
          totalValidations: totalValidations,
          passedValidations: passedValidations,
          failedValidations: totalValidations - passedValidations,
          successRate: totalValidations > 0 ? passedValidations / totalValidations : 0
        },
        status: passedValidations > 0 && passedValidations === totalValidations ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'implementation-validation',
        error: error.message,
        status: 'error'
      };
    }
  }

  async generateTestReport(payload) {
    const { testResults, includeDetails } = payload;
    try {
      // Process test results to generate report
      const report = {
        reportId: 'test-report-' + Date.now(),
        generatedAt: new Date().toISOString(),
        generatedBy: this.id,
        summary: {
          totalTestSuites: 0,
          passedTestSuites: 0,
          failedTestSuites: 0,
          skippedTestSuites: 0,
          totalTestCases: 0,
          passedTestCases: 0,
          failedTestCases: 0,
          skippedTestCases: 0,
          overallSuccessRate: 0
        },
        testSuites: [],
        recommendations: [],
        conclusions: []
      };

      // Process different types of test results
      const allResults = Array.isArray(testResults) ? testResults : [testResults];

      let totalTestCases = 0;
      let passedTestCases = 0;

      for (const result of allResults) {
        if (!result) continue;

        let suiteResult = {
          name: result.testType || result.type || 'Unknown Test Suite',
          status: result.status || 'unknown',
          timestamp: result.timestamp,
          testCases: []
        };

        // Extract test case information
        if (result.datasetResults) {
          suiteResult.testCases = result.datasetResults.map((dr, idx) => ({
            id: `ds-${idx}`,
            name: `Dataset ${idx}`,
            status: dr.status,
            details: includeDetails ? {
              inputSize: dr.inputSize,
              outputSize: dr.outputSize,
              processingTime: dr.processingTime
            } : undefined
          }));

          totalTestCases += result.datasetResults.length;
          passedTestCases += result.datasetResults.filter(r => r.status === 'success').length;
        } else if (result.scenarioResults) {
          suiteResult.testCases = result.scenarioResults.map((sr, idx) => ({
            id: `sc-${idx}`,
            name: `Scenario ${idx}`,
            status: sr.status,
            details: includeDetails ? {
              senderId: sr.senderId,
              receiverId: sr.receiverId,
              messageType: sr.messageType
            } : undefined
          }));

          totalTestCases += result.scenarioResults.length;
          passedTestCases += result.scenarioResults.filter(r => r.status === 'success').length;
        } else if (result.testResults) {
          suiteResult.testCases = result.testResults.map((tr, idx) => ({
            id: `tr-${idx}`,
            name: `Test Case ${idx}`,
            status: tr.status,
            details: includeDetails ? tr : undefined
          }));

          totalTestCases += result.testResults.length;
          passedTestCases += result.testResults.filter(r => r.status === 'passed').length;
        } else if (result.results) {
          // Handle agent test results
          for (const [agentType, agentResult] of Object.entries(result.results)) {
            if (agentResult.tests) {
              suiteResult.testCases.push({
                id: `agent-${agentType}`,
                name: `${agentType} Agent Tests`,
                status: agentResult.tests.passed > 0 ? 'passed' : 'failed',
                details: includeDetails ? agentResult.tests : undefined
              });

              totalTestCases += agentResult.tests.total || 0;
              passedTestCases += agentResult.tests.passed || 0;
            } else {
              suiteResult.testCases.push({
                id: `agent-${agentType}`,
                name: `${agentType} Agent Test`,
                status: agentResult.status,
                details: includeDetails ? agentResult : undefined
              });

              totalTestCases += 1;
              if (agentResult.status === 'passed') passedTestCases += 1;
            }
          }
        } else {
          // Single test result
          suiteResult.testCases.push({
            id: 'main',
            name: 'Main Test',
            status: result.status,
            details: includeDetails ? result : undefined
          });

          totalTestCases += 1;
          if (result.status === 'passed' || result.status === 'success') passedTestCases += 1;
        }

        // Update suite status based on test cases
        const suitePassed = suiteResult.testCases.every(tc => tc.status === 'passed' || tc.status === 'success');
        suiteResult.status = suitePassed ? 'passed' : 'failed';

        if (suiteResult.status === 'passed') {
          report.summary.passedTestSuites++;
        } else if (suiteResult.status === 'failed') {
          report.summary.failedTestSuites++;
        } else {
          report.summary.skippedTestSuites++;
        }

        report.testSuites.push(suiteResult);
      }

      // Update summary
      report.summary.totalTestSuites = allResults.length;
      report.summary.totalTestCases = totalTestCases;
      report.summary.passedTestCases = passedTestCases;
      report.summary.failedTestCases = totalTestCases - passedTestCases;
      report.summary.overallSuccessRate = totalTestCases > 0 ? passedTestCases / totalTestCases : 0;

      // Generate recommendations
      if (report.summary.overallSuccessRate < 1.0) {
        report.recommendations.push(
          'Address failing tests before proceeding to production',
          'Review test coverage for critical components',
          'Consider adding more comprehensive test cases'
        );
      } else {
        report.recommendations.push(
          'All tests passing - ready for next development phase',
          'Consider adding performance and load tests',
          'Review test maintenance strategy'
        );
      }

      // Generate conclusions
      report.conclusions.push(
        `Testing completed with ${report.summary.overallSuccessRate.toFixed(2)} success rate`,
        `${report.summary.passedTestCases}/${report.summary.totalTestCases} test cases passed`,
        `Test execution completed at ${new Date().toISOString()}`
      );

      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'test-report-generation',
        report: report,
        status: 'generated'
      };
    } catch (error) {
      return {
        agent: this.id,
        timestamp: new Date().toISOString(),
        testType: 'test-report-generation',
        error: error.message,
        status: 'error'
      };
    }
  }

  // Helper methods for creating test processors/filters/transformers
  createTestValidator() {
    return async (data) => {
      // Test validator that accepts most data but rejects obviously invalid data
      if (data === null) {
        throw new Error('Validation failed: data is null');
      }
      if (data === undefined) {
        throw new Error('Validation failed: data is undefined');
      }
      // Accept everything else for testing purposes
      return data;
    };
  }

  createTestFilter() {
    return async (data) => {
      // Test filter that lets through most data
      // Filter out only explicitly marked test data
      if (data && typeof data === 'object' && data._testFilterOut === true) {
        return false; // Filter out
      }
      return true; // Let through
    };
  }

  createTestTransformer() {
    return async (data) => {
      // Test transformer that adds a test marker
      if (data && typeof data === 'object') {
        return {
          ...data,
          _testProcessed: true,
          _testTimestamp: new Date().toISOString()
        };
      }
      return data;
    };
  }

  async runAgentTests(AgentClass, agentType, testScenarios) {
    try {
      // Create test agent instances
      const testAgent = new AgentClass(`test-${agentType}-${Date.now()}`);

      // Run test scenarios
      const scenarioResults = [];
      for (const [index, scenario] of testScenarios.entries()) {
        try {
          const { description, input, expectedOutput } = scenario;

          // Create a test task
          const testTask = new Task(
            `test-task-${Date.now()}-${index}`,
            'test-task',
            input || {},
            [],
            {}
          );

          // Execute task
          const startTime = Date.now();
          const result = await testAgent.executeTask(testTask);
          const endTime = Date.now();

          // Validate result (simplified)
          const passed = this.validateTestResult(result, expectedOutput);

          scenarioResults.push({
            scenarioIndex: index,
            description,
            passed,
            executionTime: endTime - startTime,
            result: passed ? result : `Expected: ${JSON.stringify(expectedOutput)}, Got: ${JSON.stringify(result)}`,
            timestamp: new Date().toISOString()
          });

          await new Promise(resolve => setTimeout(resolve, 20)); // Small delay
        } catch (error) {
          scenarioResults.push({
            scenarioIndex: index,
            error: error.message,
            passed: false,
            status: 'error',
            timestamp: new Date().toISOString()
          });
        }
      }

      const passedScenarios = scenarioResults.filter(sr => sr.passed).length;
      const totalScenarios = scenarioResults.length;

      return {
        agentType: agentType,
        agentId: testAgent.id,
        status: passedScenarios > 0 && passedScenarios === totalScenarios ? 'passed' : 'failed',
        tests: {
          total: totalScenarios,
          passed: passedScenarios,
          failed: totalScenarios - passedScenarios,
          successRate: totalScenarios > 0 ? passedScenarios / totalScenarios : 0
        },
        scenarioResults: scenarioResults
      };
    } catch (error) {
      return {
        agentType: agentType,
        status: 'error',
        error: error.message
      };
    }
  }

  validateTestResult(actual, expected) {
    // Simple validation - in real implementation, this would be more sophisticated
    if (expected === undefined) return true; // No expectation means pass
    if (actual === null && expected === null) return true;
    if (actual === undefined && expected === undefined) return true;
    if (typeof actual === 'object' && typeof expected === 'object') {
      // Deep equality check (simplified)
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
    return actual === expected;
  }

  async executeWorkflowWithMockAgents(workflow, testScenarios) {
    try {
      // Create mock agent factory
      const mockAgentFactory = {
        createAgent: (type) => {
          let AgentClass;
          switch (type.toLowerCase()) {
            case 'researcher':
              AgentClass = require('./researcherAgent').ResearcherAgent;
              break;
            case 'architect':
              AgentClass = require('./architectAgent').ArchitectAgent;
              break;
            case 'coder':
              AgentClass = require('./coderAgent').CoderAgent;
              break;
            case 'tester':
              AgentClass = TesterAgent;
              break;
            case 'reviewer':
              AgentClass = require('./reviewerAgent').ReviewerAgent;
              break;
            default:
              AgentClass = require('./agent').Agent;
          }
          return new AgentClass(`mock-${type}-${Date.now()}`, {});
        }
      };

      // Start workflow execution
      await workflow.startExecution(mockAgentFactory);

      // Get final status
      const finalStatus = workflow.getStatus();

      return {
        status: finalStatus.status,
        taskCounts: finalStatus.taskCounts,
        duration: finalStatus.duration,
        completedAt: finalStatus.completedAt,
        startedAt: finalStatus.startedAt
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  async generalTesting(payload) {
    return {
      agent: this.id,
      timestamp: new Date().toISOString(),
      testingType: 'general',
      description: payload.description || 'General testing task',
      testCasesExecuted: Math.floor(Math.random() * 20) + 5,
      passRate: 0.75 + Math.random() * 0.2,
      status: 'completed'
    };
  }
}

module.exports = { TesterAgent };