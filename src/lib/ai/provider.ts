import { GoogleGenAI, Type, Schema } from "@google/genai";

// -----------------------------------------------------------------------------
// Provider-Agnostic Interface
// -----------------------------------------------------------------------------
export interface AIProvider {
  generateText(prompt: string, systemMessage?: string, isJson?: boolean): Promise<string>;
  generateStructuredOutput(prompt: string, systemMessage?: string, schema?: Schema): Promise<any>;
  generateEmbedding(text: string): Promise<number[]>;
  streamText(prompt: string, systemMessage?: string): Promise<any>;
}

// -----------------------------------------------------------------------------
// Gemini Provider Implementation
// -----------------------------------------------------------------------------
class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private defaultModel: string;
  private embeddingModel: string;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "dummy-key",
    });
    this.defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    this.embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-004";
  }

  async generateText(prompt: string, systemMessage?: string, isJson?: boolean): Promise<string> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY, returning dummy data for generateText.");
      return isJson ? "{}" : "Dummy AI response.";
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: systemMessage,
          responseMimeType: isJson ? "application/json" : "text/plain",
          temperature: 0.1,
        }
      });
      
      return response.text || (isJson ? "{}" : "");
    } catch (error) {
      console.error("Gemini text generation failed:", error);
      return isJson ? "{}" : "";
    }
  }

  async generateStructuredOutput(prompt: string, systemMessage?: string, schema?: Schema): Promise<any> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY, returning dummy structure.");
      return {};
    }

    try {
      const response = await this.ai.models.generateContent({
        model: this.defaultModel,
        contents: prompt,
        config: {
          systemInstruction: systemMessage,
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
        }
      });
      
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("Gemini structured generation failed:", error);
      return {};
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY, returning dummy embedding.");
      return new Array(768).fill(0.1);
    }

    try {
      const response = await this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: text.replace(/\n/g, " "),
      });
      
      return response.embeddings?.[0]?.values || new Array(768).fill(0.1);
    } catch (error) {
      console.error("Gemini embedding generation failed:", error);
      return new Array(768).fill(0.1);
    }
  }

  async streamText(prompt: string, systemMessage?: string): Promise<any> {
    // Placeholder for future use, returning a simple response for now
    throw new Error("streamText not implemented for GeminiProvider yet");
  }
}

// -----------------------------------------------------------------------------
// Fallback Dummy Provider
// -----------------------------------------------------------------------------
class DummyProvider implements AIProvider {
  async generateText(p: string, s?: string, isJson?: boolean) { return isJson ? "{}" : "Dummy"; }
  async generateStructuredOutput() { return {}; }
  async generateEmbedding() { return new Array(768).fill(0.1); }
  async streamText() { return null; }
}

// -----------------------------------------------------------------------------
// Provider Registry & Resolution
// -----------------------------------------------------------------------------
const getProvider = (): AIProvider => {
  const providerType = process.env.AI_PROVIDER || "gemini";
  
  switch (providerType) {
    case "gemini":
      return new GeminiProvider();
    default:
      console.warn(`Unknown AI_PROVIDER: ${providerType}. Falling back to DummyProvider.`);
      return new DummyProvider();
  }
};

export const aiProvider: AIProvider = getProvider();
