'use strict';

const { spawn } = require('child_process');
const path = require('path');

/**
 * AI Automation Service
 * Bridges Node.js with Python-based AI analytics
 */
class AIAutomationService {
    constructor() {
        this.scriptPath = path.join(__dirname, '../automation/scripts/ai_processor.py');
    }

    /**
     * Call Python script for specific action
     */
    async #callPython(action, data) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [this.scriptPath, action, JSON.stringify(data)]);

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`Python process exited with code ${code}. Error: ${error}`));
                }
                try {
                    resolve(JSON.parse(output));
                } catch (e) {
                    reject(new Error(`Failed to parse Python output: ${output}`));
                }
            });
        });
    }

    async classifyDocument(text) {
        return this.#callPython('classify_doc', { text });
    }

    async detectTaskPriority(title, description) {
        return this.#callPython('task_priority', { title, description });
    }

    async predictProjectRisk(tasks) {
        // tasks should be an array of { status, dueDate }
        return this.#callPython('project_risk', { tasks });
    }
}

module.exports = new AIAutomationService();
