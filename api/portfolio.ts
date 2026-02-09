// Vercel Serverless Function: GET /api/portfolio
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getProjects, getSkills, getExperience } from "./_storage";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({
      projects: getProjects(),
      skills: getSkills(),
      experience: getExperience(),
    });
  } catch (err: any) {
    console.error("Portfolio API error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
}
