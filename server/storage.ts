import { db } from "./db";
import {
  projects, skills, experience, messages,
  type Project, type Skill, type Experience, type Message,
  type ChatRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getProjects(): Promise<Project[]>;
  getSkills(): Promise<Skill[]>;
  getExperience(): Promise<Experience[]>;
  
  // Chat
  getMessages(sessionId: string): Promise<Message[]>;
  createMessage(role: string, content: string, sessionId: string): Promise<Message>;
  
  // Seed
  seed(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getSkills(): Promise<Skill[]> {
    return await db.select().from(skills);
  }

  async getExperience(): Promise<Experience[]> {
    return await db.select().from(experience);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    // Return last 20 messages for context
    return await db.select().from(messages).where(eq(messages.sessionId, sessionId));
  }

  async createMessage(role: string, content: string, sessionId: string): Promise<Message> {
    const [msg] = await db.insert(messages).values({ role, content, sessionId }).returning();
    return msg;
  }

  async seed(): Promise<void> {
    const existingProjects = await this.getProjects();
    if (existingProjects.length === 0) {
      await db.insert(projects).values([
        {
          title: "AI Portfolio Assistant",
          description: "A co-browsing chatbot that helps visitors navigate this portfolio.",
          techStack: ["React", "TypeScript", "OpenAI", "Tailwind"],
          link: "#",
          imageUrl: "https://images.unsplash.com/photo-1531297461136-8208631433e7?w=800&q=80"
        },
        {
          title: "E-Commerce Dashboard",
          description: "Real-time analytics dashboard for online retailers.",
          techStack: ["Vue.js", "D3.js", "Node.js"],
          link: "#",
          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
        },
        {
          title: "Social Media App",
          description: "Connect and share moments with friends.",
          techStack: ["React Native", "Firebase", "Redux"],
          link: "#",
          imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80"
        }
      ]);

      await db.insert(skills).values([
        { category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"] },
        { category: "Backend", items: ["Node.js", "Express", "PostgreSQL", "Python"] },
        { category: "AI/ML", items: ["OpenAI API", "TensorFlow", "LangChain"] }
      ]);

      await db.insert(experience).values([
        {
          role: "Senior Full Stack Developer",
          company: "Tech Corp",
          period: "2023 - Present",
          description: "Leading a team of 5 developers building cloud-native applications."
        },
        {
          role: "Software Engineer",
          company: "StartUp Inc",
          period: "2021 - 2023",
          description: "Developed and maintained multiple React-based web applications."
        }
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
