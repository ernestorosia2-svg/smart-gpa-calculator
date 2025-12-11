import { GoogleGenAI, Type } from "@google/genai";
import { ImportResult } from "../types";

const apiKey = process.env.API_KEY;

// Initialize the client safely only when called to avoid init errors if key is missing initially (though it should be there)
const getAIClient = () => {
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const parseCourseText = async (text: string): Promise<ImportResult> => {
  const ai = getAIClient();
  
  const prompt = `
    Analyze the following text which contains a list of academic courses, their credits, and scores (or grades).
    Extract the course name, credit value, and numerical score for each item.
    If a grade is letter-based (A, B, C...), convert it to a reasonable number (A=95, A-=90, B+=85, B=80, etc.) or just extract if it's already a number.
    Return a clean JSON object.
    
    Text to analyze:
    "${text}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The name of the course" },
                credit: { type: Type.NUMBER, description: "Credit hours or weight" },
                score: { type: Type.NUMBER, description: "Final numerical score (0-100)" }
              },
              required: ["name", "credit", "score"]
            }
          }
        }
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) {
    throw new Error("Failed to generate valid JSON from AI response.");
  }

  try {
    return JSON.parse(jsonText) as ImportResult;
  } catch (e) {
    console.error("JSON Parse Error:", e);
    throw new Error("AI response was not valid JSON.");
  }
};