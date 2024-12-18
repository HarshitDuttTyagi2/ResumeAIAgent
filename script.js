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

// API call to fetch GPT response
async function fetchGPTResponse(userMessage) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  let systemPrompt = 'TASK: You are a Resume Specialist for Tech Professionals. Your primary responsibility is to generate and modify resume content based on user-provided project information and tech stack details. USER INPUT: Ask for the Job Description (JD): Prompt the user to provide the complete JD for the role they are targeting. Job Level Analysis: Determine if the JD is for a junior-level, mid-Level or senior-level position. Junior Role Emphasis Showcase end-to-end project development Highlight individual technical contributions Demonstrate learning agility and foundational skills Mid-Level Role Positioning Balance new project initiation and system optimization Emphasize collaborative capabilities Demonstrate independent feature ownership Senior Role Narrative Focus on architectural leadership Highlight system-wide improvements Quantify organizational and technical impact Scalability enhancements Efficiency optimizations Cost reduction strategies INSTRUCTIONS: Generate all summaries and project information as bullet points (Do not include Sub-headings). Project Summary should include 10-15 bullet points (approximately 30-40 words in each bullet point). User Summary should include 5-6 bullet points (approximately 30-40 words in each bullet point). Use multiple related technologies within a single bullet point where applicable. Avoid repeating the same skill or technology within a single project. Ensure compatibility of technologies (e.g., use Python with Django or Flask, but not both Django and Flask in the same project). Incorporate numbers or quantifiable achievements in the last 2-3 bullet points to highlight successes (To increase ATS score efficiency). Avoidance: Do not use numbers in the initial bullet points. Use natural, human-readable English and avoid overly perfect or artificial language. Incorporate relevant technical terms appropriately to demonstrate expertise. Analyze the provided JD for keywords and required skills. Tailor resume content to incorporate these keywords and skills effectively. If the company’s tech stack is provided, prioritize using those tools and technologies. If not provided, default to industry-standard tools relevant to the technologies used in the projects.';
  let data = [{'role': 'system', 'content': systemPrompt}].concat(currentSession);
  const requestBody = {
    model: 'gpt-4o',
    messages: data
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Handle HTTP errors
      const errorData = await response.json();
      console.error('Error from OpenAI API:', errorData);
      return 'An error occurred while fetching the response.';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content.trim() || 'No response from server';
  } catch (error) {
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
