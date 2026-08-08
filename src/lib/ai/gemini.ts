import { GoogleGenerativeAI } from "@google/generative-ai";

let modelInstance: any = null;

export function getGeminiModel() {
    if (modelInstance) {
        return modelInstance;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your .env.local file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    modelInstance = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });

    return modelInstance;
}

export async function generateGeminiCompletion(
    systemPrompt: string,
    userPrompt: string,
    zodSchema?: any
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY to your .env.local file.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        systemInstruction: systemPrompt || undefined,
    });

    const generationConfig: any = {};
    if (zodSchema) {
        generationConfig.responseMimeType = "application/json";
    }

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig,
    });

    const text = result.response.text();
    if (!text) {
        throw new Error("Empty response from Gemini API");
    }
    return text;
}

export async function generateAIResponse(prompt: string) {
    return generateGeminiCompletion("", prompt);
}