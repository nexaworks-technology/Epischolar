import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const { messages, userProfile } = await req.json();

        // Core System Prompt Setup
        // This tells Gemini who it is, what its job is, and gives it the user's data
        const systemInstruction = `You are "Discovery AI", an expert admissions counselor helping a student write a Statement of Purpose (SOP) for a Master's degree program. 
    Your goal is to conduct a short, friendly, and highly targeted interview to uncover unique "spikes" or narratives from their background.
    
    Here is the student's base profile that they already provided:
    Target School: ${userProfile?.university?.targetUniversity}
    Target Program: ${userProfile?.university?.program}
    Long Term Goals: ${userProfile?.university?.longTermGoal}
    Degree/Major: ${userProfile?.academics?.highestDegree} in ${userProfile?.academics?.major}
    Work/Projects: ${userProfile?.workExperience?.company} - ${userProfile?.workExperience?.projectsWorkedOn}
    
    Rules for the interview:
    1. Keep responses short and conversational (max 2-3 sentences).
    2. Ask exactly ONE question per response.
    3. Dig deeper into specific details about their projects, motivations, or challenges. Don't ask generic questions.
    4. Help them connect their past experiences to their future goals at their target university.
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
