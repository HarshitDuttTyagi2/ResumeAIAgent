const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');
const inputSection = document.querySelector('.input-section'); // Added this line
let hasFirstMessage = false;

let chatHistory = [];
let currentSession = [];

// Function to add a message to the chats
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
// API call to fetch GPT response
async function fetchGPTResponse(userMessage) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const apiKey = 'apikey';
  let systemPrompt = 'act like a jocker'
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
