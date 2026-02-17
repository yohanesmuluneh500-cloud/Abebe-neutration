
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Goal, UserMetrics, WorkoutPlan } from "../types";

const SYSTEM_INSTRUCTION = `You are Iron Mind (also known as Coach Abebe), an elite bodybuilding coach and hypertrophy specialist. Your goal is to help the user achieve maximum muscle growth and physical symmetry.
You were created by Yohanes Muluneh. If anyone asks "who created you" or "who is your creator", your answer must be "Yohanes Muluneh".

Your Personality: Motivating but No-Nonsense. Scientific. Base advice on evidence-based principles like progressive overload and mechanical tension.
Responsibilities: Workout Programming, Nutritional Tracking, Form Cues, Recovery advice.
Constraint: Always remind the user to consult a professional before starting a new supplement or extreme diet protocol.`;

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateWorkoutPlan = async (
  frequency: number,
  goal: Goal,
  experienceLevel: string
): Promise<WorkoutPlan> => {
  const ai = getGeminiClient();
  const prompt = `Generate a detailed hypertrophy-focused workout plan for a user training ${frequency} days per week with a goal of ${goal}. The user is at an ${experienceLevel} level. Provide specific exercises, sets, reps, tempo, and RPE for each exercise.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          splitType: { type: Type.STRING },
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dayName: { type: Type.STRING },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      sets: { type: Type.NUMBER },
                      reps: { type: Type.STRING },
                      tempo: { type: Type.STRING },
                      rpe: { type: Type.NUMBER },
                      formCues: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ["name", "sets", "reps", "tempo", "rpe", "formCues"]
                  }
                }
              },
              required: ["dayName", "exercises"]
            }
          }
        },
        required: ["title", "splitType", "days"]
      }
    }
  });

  return JSON.parse(response.text?.trim() || '{}');
};

export const chatWithCoach = async (message: string, history: any[]) => {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Speak in a disciplined, high-intensity American English coach's voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });
  
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const calculateMacros = async (metrics: UserMetrics): Promise<any> => {
  const ai = getGeminiClient();
  const prompt = `Calculate daily calorie and macro targets for: Weight ${metrics.weight}kg, Height ${metrics.height}cm, Age ${metrics.age}, Gender ${metrics.gender}, Activity Level ${metrics.activityLevel}, Goal ${metrics.goal}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["calories", "protein", "carbs", "fats"]
      }
    }
  });

  return JSON.parse(response.text?.trim() || '{}');
};

export const getFoodNutrition = async (query: string): Promise<any> => {
  const ai = getGeminiClient();
  const prompt = `Analyze nutrition for: "${query}".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          servingSize: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          grade: { type: Type.STRING },
          coachTip: { type: Type.STRING }
        },
        required: ["foodName", "servingSize", "calories", "protein", "carbs", "fats", "grade", "coachTip"]
      }
    }
  });

  return JSON.parse(response.text?.trim() || '{}');
};
