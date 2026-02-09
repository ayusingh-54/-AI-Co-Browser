import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { openai } from "./replit_integrations/image/client"; // reusing client setup from image module for convenience, or I can import OpenAI directly. 
// Actually, I'll use the OpenAI client from the blueprint's client file to ensure env vars are picked up correctly.
// The blueprint put client.ts in server/replit_integrations/image/client.ts AND server/replit_integrations/audio/client.ts. 
// I'll import from one of them.
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed data on startup
  await storage.seed();

  app.get(api.portfolio.get.path, async (req, res) => {
    const projects = await storage.getProjects();
    const skills = await storage.getSkills();
    const experience = await storage.getExperience();
    res.json({ projects, skills, experience });
  });

  app.post(api.chat.sendMessage.path, async (req, res) => {
    try {
      const { message, context, sessionId } = api.chat.sendMessage.input.parse(req.body);

      // Save user message
      await storage.createMessage('user', message, sessionId);

      // Get history
      const history = await storage.getMessages(sessionId);
      
      const systemPrompt = `You are a helpful portfolio assistant. You are currently co-browsing the portfolio website with the user.
      
      Here is the current visible content on the page (DOM text):
      ---
      ${context.slice(0, 5000)} // Truncate to avoid token limits if necessary
      ---

      Your goal is to help the user navigate the portfolio, answer questions about the projects/skills/experience shown, and perform actions like scrolling or highlighting.
      
      If the user asks to see a specific section, use the 'navigateTo' tool.
      If the user asks about a specific project, use 'highlightElement' to point it out if it's visible, or 'navigateTo' to the projects section first.
      
      Available sections IDs: #home, #about, #skills, #experience, #projects, #contact.
      
      Be concise and friendly.`;

      const tools = [
        {
          type: "function" as const,
          function: {
            name: "scroll",
            description: "Scroll the page up or down",
            parameters: {
              type: "object",
              properties: {
                direction: { type: "string", enum: ["up", "down"] },
              },
              required: ["direction"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "navigateTo",
            description: "Scroll to a specific section",
            parameters: {
              type: "object",
              properties: {
                sectionId: { type: "string", description: "The ID of the section (e.g., #projects)" },
              },
              required: ["sectionId"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "highlightElement",
            description: "Highlight a specific element on the page",
            parameters: {
              type: "object",
              properties: {
                selector: { type: "string", description: "CSS selector of the element to highlight" },
              },
              required: ["selector"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "clickElement",
            description: "Click a specific element on the page",
            parameters: {
              type: "object",
              properties: {
                selector: { type: "string", description: "CSS selector of the element to click" },
              },
              required: ["selector"],
            },
          },
        },
        {
          type: "function" as const,
          function: {
            name: "inputText",
            description: "Input text into a form field",
            parameters: {
              type: "object",
              properties: {
                selector: { type: "string", description: "CSS selector of the input element" },
                text: { type: "string", description: "The text to input" },
              },
              required: ["selector", "text"],
            },
          },
        },
      ];

      const completion = await openaiClient.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content }))
        ],
        tools,
        tool_choice: "auto",
      });

      const choice = completion.choices[0];
      const toolCall = choice.message.tool_calls?.[0];
      const content = choice.message.content;

      // Save assistant response
      await storage.createMessage('assistant', content || (toolCall ? `[Executing ${toolCall.function.name}]` : ""), sessionId);

      if (toolCall) {
        res.json({
          response: content || undefined,
          toolCall: {
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments),
          },
        });
      } else {
        res.json({ response: content || "" });
      }

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
