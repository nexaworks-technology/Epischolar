import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // Initialize Gemini within the handler to prevent build-time errors
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    try {
        const { messages, userProfile } = await req.json();

        const systemInstruction = `You are "Discovery AI", an elite investigative journalist and Ivy League admissions counselor helping a student write a highly personal College Application Essay. 
    Your goal is to conduct a short, friendly, and highly targeted interview using **Recursive Questioning** to uncover a unique "Slice of Life" narrative.
    
    Here is the student's base profile that they already provided:
    Target School: ${userProfile?.university?.targetUniversity}
    Target Program: ${userProfile?.university?.program}
    Core Identity/Challenge: ${userProfile?.personalBackground?.story}
    Activities: ${userProfile?.extraCurricular?.organizations}
    
    CRITICAL RULES FOR THE INTERVIEW:
    1. Keep responses very short and conversational (max 2-3 sentences).
    2. Ask exactly ONE question per response.
    3. You MUST follow this exact 4-step 'Recursive Questioning' sequence, advancing step-by-step as the user answers:
       Step 1 (Broad Hook): Ask for a project, moment, or experience that changed how they view their major/academic field.
       Step 2 (Slice of Life Zoom-In): When they answer, push back and ask for a specific scene: "Where were you? What did you see, hear, or feel in the exact moment you realized you were failing or succeeding?"
       Step 3 (Intellectual Pivot): Ask how that specific emotional moment changed their intellectual approach to the subject.
       Step 4 (University Synergy): Ask how that realization connects to a specific professor, lab, or value at their target university.
    4. Never skip ahead. Guide the user through these 4 steps sequentially. Let them be the focus.
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
