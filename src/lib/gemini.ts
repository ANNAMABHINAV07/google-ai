import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateDailyReport(sessions: any[], goals: any[]) {
  if (!process.env.GEMINI_API_KEY) return "AI Summary unavailable: Missing API Key";

  const prompt = `
    Analyze these focus sessions and goals for today:
    Sessions: ${JSON.stringify(sessions)}
    Goals: ${JSON.stringify(goals)}
    
    Provide a encouraging daily report summary, total focus time analysis, and 3 actionable insights for tomorrow.
    Return the response as a JSON object with fields: summary, totalFocusTime, goalsAccomplished, insights.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API error:", error);
    return { summary: "Could not generate report today.", insights: "Try again tomorrow!" };
  }
}

export async function getCoachingMessage(userName: string, currentSessionCount: number) {
  const prompt = `Helpful coaching message for ${userName} who has finished ${currentSessionCount} focus sessions today. Keep it short, motivational, and technical.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Keep pushing towards your goals!";
  }
}
