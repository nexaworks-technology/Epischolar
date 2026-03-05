import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

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
    
    CRITICAL CONSTRAINTS (The 25 Essay Mistakes to Avoid):
    - NO clichés (e.g., "Since I was a child...", "I have always been passionate about...").
    - NO resume-listing. Do not just list achievements; tell a story about one or two.
    - NO passive voice. Use strong, active verbs.
    - NO generic praise for the university. Be highly specific.
    - SHOW, DON'T TELL. Describe a specific moment or "Slice of Life" that demonstrates the applicant's qualities.

    You MUST return the output strictly as a JSON object with exactly these keys:
    {
      "introduction": "A compelling 'Narrative Hook' and 'Slice of Life' opening (approx 100-150 words)",
      "academic": "Academic foundation and the applicant's unique 'Spike' (approx 150-200 words)",
      "professional": "Professional & Experiential Proof told through a specific challenge (approx 150-200 words)",
      "futureGoals": "Why This University & Future Goals. YOU MUST weave in the specific professors, labs, or core values provided in the University Research Data below (approx 100-150 words)",
      "analysis": [
         {
           "paragraph": "introduction" | "academic" | "professional" | "futureGoals",
           "principle": "e.g., Intellectual Vitality, Narrative Hook, Showing vs Telling",
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
            { error: "Failed to generate Essay" },
            { status: 500 }
        );
    }
}
