import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  techStack: text("tech_stack").array().notNull(),
  link: text("link"),
  imageUrl: text("image_url"),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // Frontend, Backend, Tools
  items: text("items").array().notNull(),
});

export const experience = pgTable("experience", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  company: text("company").notNull(),
  period: text("period").notNull(),
  description: text("description").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  // For simplicity in this demo, we won't strictly link to a conversation table, just a flat list or session-based if needed.
  // But strictly adhering to the prompt "Maintain conversation history".
  sessionId: text("session_id").notNull(), 
});

// Schemas
export const insertProjectSchema = createInsertSchema(projects);
export const insertSkillSchema = createInsertSchema(skills);
export const insertExperienceSchema = createInsertSchema(experience);
export const insertMessageSchema = createInsertSchema(messages);

export type Project = typeof projects.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Experience = typeof experience.$inferSelect;
export type Message = typeof messages.$inferSelect;

// API Types
export type ChatRequest = {
  message: string;
  context: string; // DOM text content
  sessionId: string;
};

export type ChatResponse = {
  response?: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
};
