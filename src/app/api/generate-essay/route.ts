import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { CORE_GENERATION_CONSTRAINTS } from "@/prompts/ivy-league-logic";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
    try {
        const { formData, chatMessages } = await req.json();

        let uniData = null;
        if (formData?.university?.targetUniversity) {
            try {
                // Internal API call to our own getUniversityContext endpoint
                // We use headers to pass the host if needed, but since it's server-side, 
                // we can just call the POST method directly or hit the absolute URL.
                // It's cleaner to construct the URL from the request.
                const protocol = req.headers.get("x-forwarded-proto") || "http";
                const host = req.headers.get("host");
                const baseUrl = `${protocol}://${host}`;

                const uniRes = await fetch(`${baseUrl}/api/getUniversityContext`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ universityName: formData.university.targetUniversity })
                });

                if (uniRes.ok) {
                    const uniJson = await uniRes.json();
                    uniData = uniJson.data;
                }
            } catch (err) {
                console.error("Failed to fetch university context during SOP generation:", err);
                // Non-blocking, we just proceed without the extra context if it fails.
            }
        }

        const systemInstruction = `You are an elite, world-class Ivy League admissions consultant. 
    You are writing a highly personal College Application Essay for a prospective student. 
    You must use the "Narrative Hook" and "Slice of Life" frameworks found in '50 Successful Ivy League Application Essays'.
    
    ${CORE_GENERATION_CONSTRAINTS}

    You MUST return the output strictly as a JSON object with exactly these keys:
    {
      "paragraph1": "Para 1 (The Scene): Start in media res using sensory details from Step 2 of the chat (approx 150 words)",
      "paragraph2": "Para 2 (The Internal Pivot): Detail the student's internal monologue, doubts, and realization (approx 150 words)",
      "paragraph3": "Para 3 (The Action): Show the research or change in behavior resulting from the realization (approx 150 words)",
      "paragraph4": "Para 4 (The Synergy): Connect the action to the specific university data scraped from the backend (approx 150 words)",
      "analysis": [
         {
           "paragraph": "paragraph1" | "paragraph2" | "paragraph3" | "paragraph4",
           "principle": "e.g., Sensory Details, Internal Monologue, Showing vs Telling, University Alignment",
           "explanation": "A short 1-sentence tooltip explaining why this paragraph succeeds based on Ivy League principles."
         }
      ]
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
    
    ${uniData ? `University Research Data (MUST USE IN FUTURE GOALS SECTION):\n${JSON.stringify(uniData, null, 2)}` : ''}
    
    Draft the College Application Essay combining all this context seamlessly. Output ONLY valid JSON.
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.4,
                responseMimeType: "application/json",
            }
        });

        let jsonResponse;
        if (response.text) {
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResponse = JSON.parse(cleanText);
        } else {
            throw new Error("Empty response from AI");
        }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error("Gemini API Error:", error.message || error);
        return NextResponse.json(
            { error: "Failed to generate Essay", details: error.message },
            { status: 500 }
        );
    }
}
