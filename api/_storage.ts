// Shared in-memory storage for Vercel serverless functions
// Note: In serverless, each invocation may get a fresh instance.
// Conversation history is per-invocation unless an external store is used.
// For a demo/portfolio this is acceptable.

import type { Project, Skill, Experience, Message } from "../shared/schema";

const projects: Project[] = [
  {
    id: 1,
    title: "AI Portfolio Assistant",
    description: "A co-browsing chatbot that helps visitors navigate this portfolio.",
    techStack: ["React", "TypeScript", "OpenAI", "Tailwind"],
    link: "#",
    imageUrl: "https://images.unsplash.com/photo-1531297461136-8208631433e7?w=800&q=80"
  },
  {
    id: 2,
    title: "E-Commerce Dashboard",
    description: "Real-time analytics dashboard for online retailers.",
    techStack: ["Vue.js", "D3.js", "Node.js"],
    link: "#",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
  },
  {
    id: 3,
    title: "Social Media App",
    description: "Connect and share moments with friends.",
    techStack: ["React Native", "Firebase", "Redux"],
    link: "#",
    imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80"
  }
];

const skills: Skill[] = [
  { id: 1, category: "Frontend", items: ["React", "TypeScript", "Tailwind CSS", "Framer Motion"] },
  { id: 2, category: "Backend", items: ["Node.js", "Express", "PostgreSQL", "Python"] },
  { id: 3, category: "AI/ML", items: ["OpenAI API", "TensorFlow", "LangChain"] }
];

const experience: Experience[] = [
  {
    id: 1,
    role: "Senior Full Stack Developer",
    company: "Tech Corp",
    period: "2023 - Present",
    description: "Leading a team of 5 developers building cloud-native applications."
  },
  {
    id: 2,
    role: "Software Engineer",
    company: "StartUp Inc",
    period: "2021 - 2023",
    description: "Developed and maintained multiple React-based web applications."
  }
];

// In-memory message store (resets per cold start, fine for demo)
const messagesStore: Message[] = [];
let nextId = 1;

export function getProjects() { return projects; }
export function getSkills() { return skills; }
export function getExperience() { return experience; }

export function getMessages(sessionId: string) {
  return messagesStore.filter(m => m.sessionId === sessionId).slice(-20);
}

export function createMessage(role: string, content: string, sessionId: string): Message {
  const msg: Message = { id: nextId++, role, content, sessionId };
  messagesStore.push(msg);
  return msg;
}
