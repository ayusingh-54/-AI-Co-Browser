// Vercel Serverless Function: GET /api/portfolio
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getProjects, getSkills, getExperience } from "./_storage";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  return res.status(200).json({
    projects: getProjects(),
    skills: getSkills(),
    experience: getExperience(),
  });
}
