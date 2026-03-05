import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const { formData, chatMessages } = await req.json();

        const systemInstruction = `You are an elite, world-class admissions consultant helping a student write a Statement of Purpose (SOP) for a Master's degree program using the "Golden Thread" framework.
    You must output a highly compelling, personalized SOP based on their provided profile data and their chat interview transcript.
    You MUST return the output strictly as a JSON object with exactly these four string keys:
    {
      "introduction": "A compelling hook and motivation (approx 100-150 words)",
      "academic": "Academic foundation and the 'Spike' (approx 150-200 words)",
      "professional": "Professional & Experiential Proof (approx 150-200 words)",
      "futureGoals": "Why This University & Future Goals (approx 100-150 words)"
    }`;

        // Flatten chat transcript
        const transcript = chatMessages.map((msg: any) =>
            `${msg.role === 'model' ? 'Interviewer' : 'Applicant'}: ${msg.parts[0].text}`
        ).join("\n");

        const prompt = `
    User Profile Data:
    ${JSON.stringify(formData, null, 2)}
    
    Discovery Interview Transcript:
    ${transcript}
    
    Draft the SOP combining all this context seamlessly.
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.7,
                responseMimeType: "application/json",
            }
        });

        let jsonResponse;
        if (response.text) {
            jsonResponse = JSON.parse(response.text);
        } else {
            throw new Error("Empty response from AI");
        }

        return NextResponse.json(jsonResponse);

    } catch (error) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: "Failed to generate SOP" },
            { status: 500 }
        );
    }
}
