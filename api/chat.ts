// Vercel Serverless Function: POST /api/chat
import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { getMessages, createMessage } from "./_storage";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { message, context, sessionId } = req.body;

    if (!message || !context || !sessionId) {
      return res.status(400).json({ message: "Missing required fields: message, context, sessionId" });
    }

    // Save user message
    createMessage("user", message, sessionId);

    // Get history
    const history = getMessages(sessionId);

    const systemPrompt = `You are a helpful portfolio assistant. You are currently co-browsing the portfolio website with the user.
      
      Here is the current visible content on the page (DOM text):
      ---
      ${context.slice(0, 5000)}
      ---

      Your goal is to help the user navigate the portfolio, answer questions about the projects/skills/experience shown, and perform actions like scrolling or highlighting.
      
      If the user asks to see a specific section, use the 'navigateTo' tool.
      If the user asks about a specific project, use 'highlightElement' to point it out if it's visible, or 'navigateTo' to the projects section first.
      
      Available sections IDs: #home, #about, #skills, #experience, #projects, #contact.
      
      Be concise and friendly.`;

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
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
        type: "function",
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
        type: "function",
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
        type: "function",
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
        type: "function",
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
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      ],
      tools,
      tool_choice: "auto",
    });

    const choice = completion.choices[0];
    const toolCalls = choice.message.tool_calls;
    const toolCall = toolCalls?.[0] as any;
    const content = choice.message.content;

    // Save assistant response
    createMessage(
      "assistant",
      content || (toolCall ? `[Executing ${toolCall.function.name}]` : ""),
      sessionId
    );

    if (toolCall) {
      return res.status(200).json({
        response: content || undefined,
        toolCall: {
          name: toolCall.function.name,
          args: JSON.parse(toolCall.function.arguments),
        },
      });
    } else {
      return res.status(200).json({ response: content || "" });
    }
  } catch (err: any) {
    console.error("Chat API error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
