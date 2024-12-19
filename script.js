const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');
const inputSection = document.querySelector('.input-section'); // Added this line
let hasFirstMessage = false;

let chatHistory = [];
let currentSession = [];

// Function to add a message to the chat
function addMessage(role, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = text;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
}

function handleFirstMessage() {
  if (!hasFirstMessage) {
    inputSection.classList.remove('starting');
    hasFirstMessage = true;
  }
}

// Save current chat session to history
function saveToHistory() {
  if (currentSession.length > 0) {
    const historyItem = document.createElement('li');
    const sessionTitle = `Chat #${chatHistory.length + 1}`;
    historyItem.textContent = sessionTitle;
    historyItem.addEventListener('click', () => loadChat(currentSession));
    if (historyList) {
      historyList.appendChild(historyItem);
    }

    chatHistory.push([...currentSession]);
    currentSession = [];
  }
}

// Load a chat session from history
function loadChat(session) {
  chatWindow.innerHTML = '';
  session.forEach(({ role, content }) => addMessage(role, content));
}

// API call to fetch GPT response using the serverless function
// Function to add timeout to fetch request
async function fetchGPTResponse(userMessage) {

  const apiUrl = '/api/chat'; // Path to the serverless function

  let systemPrompt = 
  'TASK: ' + 
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
    currentSession: currentSession, // Send current chat session
    prompt: systemPrompt, // Send system prompt
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // Set timeout to 20 seconds

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal, // Attach the abort signal to the fetch request
    });

    clearTimeout(timeoutId); // Clear timeout if the request completes in time

    if (!response.ok) {
      // Handle HTTP errors
      const errorData = await response.text();
      console.error('Error from serverless function:', errorData);
      return `Error: ${errorData || 'An error occurred while fetching the response.'}`;
    }

    // Try parsing the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Error parsing response as JSON:', jsonError);
      return 'The server returned an invalid response. Please try again later.';
    }

    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content.trim() || 'No response from server';
    } else {
      return 'Unexpected response structure from the API.';
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Request timed out');
      return 'The request timed out. Please try again later.';
    }
    console.error('Fetch error:', error);
    return 'An error occurred. Please try again.';
  }
}


// Send a message
async function handleSendMessage() {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  handleFirstMessage();

  addMessage('user', userMessage);
  currentSession.push({ role: 'user', content: userMessage });
  userInput.value = '';
  userInput.style.height = 'auto'; // Reset input height

  const botResponse = await fetchGPTResponse(userMessage);
  addMessage('gpt', botResponse);
  currentSession.push({ role: 'assistant', content: botResponse });
}

// Adjust textarea height dynamically
userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = `${userInput.scrollHeight}px`;
});

// Save session on unload
window.addEventListener('beforeunload', saveToHistory);

// Event listeners
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});
