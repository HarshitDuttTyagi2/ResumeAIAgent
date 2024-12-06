const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');

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

// Save current chat session to history
function saveToHistory() {
  if (currentSession.length > 0) {
    const historyItem = document.createElement('li');
    const sessionTitle = `Chat #${chatHistory.length + 1}`;
    historyItem.textContent = sessionTitle;
    historyItem.addEventListener('click', () => loadChat(currentSession));
    historyList.appendChild(historyItem);

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
  const apiUrl = 'https://my.orq.ai/v2/deployments/invoke';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3Jrc3BhY2VJZCI6ImVjZTM3MzA3LWU3ZjUtNDY5ZS05MjMzLWIyOGI4ZDhhN2QyOSIsImlhdCI6MTczMzI0MDQ2MDc4MiwiaXNzIjoib3JxIn0.BQqpb-MpinzIadeN_72P9GiboJrwmJkNXYtEP-aYrGw';

  const requestBody = {
    key: "husain_bw",
    context: {
      environments: []
    },
    metadata: {},
    messages: currentSession
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

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response from server';
  } catch (error) {
    console.error(error);
    return 'An error occurred. Please try again.';
  }
}

// Send a message
async function handleSendMessage() {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

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


