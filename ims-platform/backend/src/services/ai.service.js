'use strict';

const Settings = require('../models/Settings');

/**
 * AI Service for dynamic provider management
 */
class AIService {
    async getClient() {
        const settings = await Settings.findOne();
        if (!settings || !settings.aiProvider || settings.aiProvider === 'none') {
            return null;
        }

        const provider = settings.aiProvider;

        try {
            if (provider === 'gemini') {
                if (!settings.geminiKey) return null;
                const { GoogleGenAI } = require('@google/genai');
                const genAI = new GoogleGenAI(settings.geminiKey);
                return {
                    provider: 'gemini',
                    client: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
                    generate: async (prompt) => {
                        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt);
                        return result.response.text();
                    }
                };
            }

            if (provider === 'openai') {
                if (!settings.openaiKey) return null;
                const OpenAI = require('openai');
                const openai = new OpenAI({ apiKey: settings.openaiKey });
                return {
                    provider: 'openai',
                    client: openai,
                    generate: async (prompt) => {
                        const completion = await openai.chat.completions.create({
                            messages: [{ role: "user", content: prompt }],
                            model: "gpt-3.5-turbo",
                        });
                        return completion.choices[0].message.content;
                    }
                };
            }

            if (provider === 'groq') {
                if (!settings.groqKey) return null;
                const Groq = require('groq-sdk');
                const groq = new Groq({ apiKey: settings.groqKey });
                return {
                    provider: 'groq',
                    client: groq,
                    generate: async (prompt) => {
                        const completion = await groq.chat.completions.create({
                            messages: [{ role: "user", content: prompt }],
                            model: "llama3-8b-8192",
                        });
                        return completion.choices[0].message.content;
                    }
                };
            }
        } catch (err) {
            console.error(`AI Client initialization failed for ${provider}:`, err);
            return null;
        }

        return null;
    }

    async getInsights(prompt) {
        const client = await this.getClient();
        if (!client) {
            return "AI Insights currently unavailable. Please configure your AI provider in Settings.";
        }

        try {
            return await client.generate(prompt);
        } catch (err) {
            console.error(`AI Insight generation failed (${client.provider}):`, err);
            return "Failed to generate AI insights. Please check your API key and connection settings.";
        }
    }
}

module.exports = new AIService();
