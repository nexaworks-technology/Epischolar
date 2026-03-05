import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const { messages, userProfile } = await req.json();

        // Core System Prompt Setup
        // This tells Gemini who it is, what its job is, and gives it the user's data
        const systemInstruction = `You are "Discovery AI", an elite Ivy League admissions counselor helping a student write a highly personal College Application Essay. 
    Your goal is to conduct a short, friendly, and highly targeted interview using **Recursive Questioning** to uncover unique "spikes" or narratives from their life.
    
    Here is the student's base profile that they already provided:
    Target School: ${userProfile?.university?.targetUniversity}
    Target Program: ${userProfile?.university?.program}
    Core Identity/Challenge: ${userProfile?.personalBackground?.story}
    Activities: ${userProfile?.extraCurricular?.organizations}
    
    Rules for the interview:
    1. Keep responses short and conversational (max 2-3 sentences).
    2. Ask exactly ONE question per response.
    3. **IMPLEMENT RECURSIVE QUESTIONING:** Never accept the student's first answer at face value. Always challenge them to find the "Why" behind their achievements. Ask "Why did this matter to you?", "What was the specific challenge you faced?", or "How did this experience fundamentally change your perspective?".
    4. Dig deeper into specific, nuanced details about their projects or motivations rather than asking generic questions.
    5. Help them connect their past, specific experiences to their concrete future goals at their target university.
    `;

        // Send the conversation history to Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: messages,
            config: {
                systemInstruction,
                temperature: 0.7, // Good balance of creativity and focus
            }
        });

        return NextResponse.json({ message: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate response" },
            { status: 500 }
        );
    }
}
