import { GoogleGenAI, Type, Schema } from "@google/genai";
import Groq from "groq-sdk";

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
// Groq Provider Implementation
// -----------------------------------------------------------------------------
class GroqProvider implements AIProvider {
  private groq: Groq;
  private defaultModel: string;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || "dummy-key",
    });
    this.defaultModel = "llama-3.3-70b-versatile";
  }

  async generateText(prompt: string, systemMessage?: string, isJson?: boolean): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
      console.warn("Missing GROQ_API_KEY, returning dummy data for generateText.");
      return isJson ? "{}" : "Dummy AI response.";
    }

    try {
      const messages: any[] = [];
      if (systemMessage) {
        messages.push({ role: "system", content: systemMessage });
      }
      messages.push({ role: "user", content: prompt });

      const response = await this.groq.chat.completions.create({
        messages,
        model: this.defaultModel,
        temperature: 0.1,
        response_format: isJson ? { type: "json_object" } : undefined,
      });
      
      return response.choices[0]?.message?.content || (isJson ? "{}" : "");
    } catch (error) {
      console.error("Groq text generation failed:", error);
      return isJson ? "{}" : "";
    }
  }

  async generateStructuredOutput(prompt: string, systemMessage?: string, schema?: Schema): Promise<any> {
    const text = await this.generateText(prompt, systemMessage ? systemMessage + "\nPlease output valid JSON." : "Please output valid JSON.", true);
    try {
      return JSON.parse(text);
    } catch (e) {
      return {};
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return new Array(768).fill(0.1);
  }

  async streamText(prompt: string, systemMessage?: string): Promise<any> {
    throw new Error("streamText not implemented for GroqProvider yet");
  }
}

// -----------------------------------------------------------------------------
// Provider Registry & Resolution
// -----------------------------------------------------------------------------
const getProvider = (): AIProvider => {
  const providerType = process.env.AI_PROVIDER || "gemini";
  
  switch (providerType) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    default:
      console.warn(`Unknown AI_PROVIDER: ${providerType}. Falling back to DummyProvider.`);
      return new DummyProvider();
  }
};

export const aiProvider: AIProvider = getProvider();
