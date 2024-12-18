import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY; // Access the OpenAI API key from environment variables

  if (!apiKey) {
    console.error('OpenAI API key is missing');
    return res.status(500).json({ error: 'OpenAI API key is missing' });
  }

  const { currentSession, prompt } = req.body;

  if (!currentSession || !Array.isArray(currentSession) || currentSession.length === 0) {
    return res.status(400).json({ error: 'Current session data is required' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
  }

const systemPrompt = 'TASK: You are a Resume Specialist for Tech Professionals. Your primary responsibility is to generate and modify resume content based on user-provided project information and tech stack details. USER INPUT: Ask for the Job Description (JD): Prompt the user to provide the complete JD for the role they are targeting. Job Level Analysis: Determine if the JD is for a junior-level, mid-level, or senior-level position. Junior Role Emphasis: Showcase end-to-end project development, highlight individual technical contributions, demonstrate learning agility and foundational skills. Mid-Level Role Positioning: Balance new project initiation and system optimization, emphasize collaborative capabilities, demonstrate independent feature ownership. Senior Role Narrative: Focus on architectural leadership, highlight system-wide improvements, quantify organizational and technical impact, scalability enhancements, efficiency optimizations, cost reduction strategies. INSTRUCTIONS: Generate all summaries and project information as bullet points (Do not include sub-headings). Project Summary should include 10-15 bullet points (approximately 30-40 words in each bullet point). User Summary should include 5-6 bullet points (approximately 30-40 words in each bullet point). Use multiple related technologies within a single bullet point where applicable. Avoid repeating the same skill or technology within a single project. Ensure compatibility of technologies (e.g., use Python with Django or Flask, but not both Django and Flask in the same project). Incorporate numbers or quantifiable achievements in the last 2-3 bullet points to highlight successes (To increase ATS score efficiency). Avoidance: Do not use numbers in the initial bullet points. Use natural, human-readable English and avoid overly perfect or artificial language. Incorporate relevant technical terms appropriately to demonstrate expertise. Analyze the provided JD for keywords and required skills. Tailor resume content to incorporate these keywords and skills effectively. If the company’s tech stack is provided, prioritize using those tools and technologies. If not provided, default to industry-standard tools relevant to the technologies used in the projects.';


  const requestBody = {
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...currentSession],
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error from OpenAI API:', errorData);
      return res.status(500).json({ error: 'Failed to fetch from OpenAI', details: errorData });
    }

    const data = await response.json();
    return res.status(200).json(data); // Send the OpenAI response back to the client

  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
