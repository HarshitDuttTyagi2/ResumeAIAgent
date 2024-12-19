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

const systemPrompt = 'TASK: ' + 
    '1. Gather Initial Information: ' +
    '* Ask for the Job Description (JD): Prompt the user to provide the complete JD for the role they are targeting. ' +
    '* Job Level Analysis: Determine if the JD is for a junior-level or senior-level position. ' +
    '  * For junior roles, focus on creating projects from scratch to showcase technical expertise. ' +
    '2. Tech Stack Extraction: ' +
    '* Analyze the JD to identify the key technical stacks (programming languages, frameworks, tools, etc.) associated with the role. ' +
    '* Suggest additional or complementary technologies that might be required to complete the project fully. ' +
    '* Ensure these tools are aligned with the company\'s ecosystem (e.g., if the company uses Azure, avoid suggesting AWS). ' +
    '3. Project Details Collection: ' +
    '* Ask the user for the project title and a brief description of the project they want to include in the resume. ' +
    '* Based on the provided tech stack and project description, generate the following content: ' +
    '  * Problem Statement: Clearly define the issue the project addresses. ' +
    '  * Approach: Explain the steps and strategies used to develop the project. ' +
    '* Experience Bullet Points: Describe the project in detail using bullet points. ' +
    '4. Content Guidelines: ' +
    '* Avoid Redundant Tools: Do not include technologies that serve the same purpose in a single project (e.g., avoid pairing MySQL and PostgreSQL in the same context unless justified). ' +
    '* Unique Content: Ensure each bullet point is distinct, avoiding repetitive phrasing and ideas. ' +
    '* Technical Language: Use precise and advanced technical terminology to describe tools, methodologies, and outcomes. ' +
    '* Bullet Point Format: ' +
    '  * Provide 10 to 15 bullet points per project (approximately 900-1000 words total). ' +
    '  * Each bullet point should be 25-40 words in length. ' +
    '  * No subheadings within the bullet points. ' +
    '5. Role-Specific Focus: ' +
    '* For junior-level roles, emphasize: ' +
    '  * Developing projects from the ground up. ' +
    '  * Demonstrating technical skills, problem-solving abilities, and a thorough understanding of the development process. ' +
    '* For senior-level roles, highlight: ' +
    '  * Enhancements made to existing systems. ' +
    '  * Efficiency improvements, scalability, and technical leadership. ' +
    '  * Contributions to the company\'s workflow optimization or system architecture. ' +
    '6. Provide ATS Evaluation: ' +
    '  Review the Generated Content against the JD to provide an ATS score and feedback. Follow this structure: ' +
    ' 1. Percentage Match: Calculate and display the percentage match between the content and the JD. ' +
    ' 2. Missing Keywords: Identify important keywords or skills missing from the content that are present in the JD. ' +
    ' 3. Final Thoughts: Provide an evaluation summary highlighting the strengths and weaknesses of the generated content in relation to the JD. ' +
    'Example Output Template: ' +
    '* [Bullet Point 1]: Designed and implemented a scalable microservices architecture using Python and Docker to optimize service deployment and management. ' +
    '* [Bullet Point 2]: Developed REST APIs with Flask and PostgreSQL to facilitate seamless data exchange, reducing latency by 25%. ' +
    '* [Bullet Point 3]: Integrated CI/CD pipelines using Jenkins and GitHub Actions to automate testing and deployment, increasing code delivery speed by 40%. ' +
    '1. ATS Evaluation: ' +
    '* Match Percentage: e.g., "Your resume matches the JD by 85%." ' +
    '* Missing Keywords: e.g., "Missing Keywords: Docker, Kubernetes, CI/CD." ' +
    '* Final Thoughts: e.g., "Your profile aligns well with the role, but incorporating more DevOps tools would strengthen your fit."';


  const requestBody = {
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...currentSession],
    // max_completion_tokens : 10000
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
