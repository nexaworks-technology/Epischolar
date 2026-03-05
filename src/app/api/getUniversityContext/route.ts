import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(request: Request) {
    try {
        const { universityName } = await request.json();

        if (!universityName) {
            return NextResponse.json({ error: 'University name is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('epischolar');
        const collection = db.collection('Universities');

        // 1. Check if university exists in MongoDB
        // We use a case-insensitive regex or text search
        const existingUni = await collection.findOne({
            name: { $regex: new RegExp(`^${universityName}$`, 'i') }
        });

        if (existingUni) {
            return NextResponse.json({ source: 'db', data: existingUni }, { status: 200 });
        }

        // 2. If not found, use Gemini to instantly research
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", generationConfig: { responseMimeType: "application/json" } });

        const prompt = `Research the university "${universityName}".
    Return a JSON object strictly following this structure:
    {
      "name": "Full string name of the university",
      "core_values": "A short phrase describing their core values (e.g., 'Technological Innovation' or 'Social Impact')",
      "target_labs": ["Lab 1", "Lab 2", "Lab 3"],
      "notable_faculty": ["Professor 1", "Professor 2", "Professor 3"]
    }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Parse the JSON text
        let uniData;
        try {
            uniData = JSON.parse(text);
        } catch (e) {
            // In case the model returns markdown like \`\`\`json ... \`\`\`
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            uniData = JSON.parse(cleanText);
        }

        // Ensure the data has the name proper
        uniData.name = uniData.name || universityName;
        uniData.createdAt = new Date();

        // 3. Store in Universities collection
        await collection.insertOne(uniData);

        return NextResponse.json({ source: 'gemini', data: uniData }, { status: 200 });

    } catch (error: any) {
        console.error('Error fetching university context:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
