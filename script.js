// script.js
const chatWindow = document.getElementById('chat-window');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const historyList = document.getElementById('history-list');

// Store conversations in memory
let chatHistory = [];
let currentSession = [];

// Function to add a message
function addMessage(role, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = text;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to the bottom
}

// Function to save the current session to history
function saveToHistory() {
  if (currentSession.length > 0) {
    const historyItem = document.createElement('li');
    const sessionTitle = `Chat #${chatHistory.length + 1}`;
    historyItem.textContent = sessionTitle;
    historyItem.addEventListener('click', () => loadChat(currentSession));
    historyList.appendChild(historyItem);

    // Save session in memory
    chatHistory.push([...currentSession]);
    currentSession = [];
  }
}

// Function to load a chat session from history
function loadChat(session) {
  chatWindow.innerHTML = ''; // Clear the chat window
  session.forEach(({ role, text }) => addMessage(role, text));
}

// Function to make an API call to the backend
async function fetchGPTResponse(userMessage) {
  try {
    // const response = await fetch('/api/chat', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ message: userMessage }),
    // });

    // if (!response.ok) {
    //   throw new Error(`Error: ${response.statusText}`);
    // }

    // const data = await response.json();
    return 'Hi how are you.'//data.reply; // Assuming the backend returns a JSON object with a `reply` field
  } catch (error) {
    console.error('Failed to fetch GPT response:', error);
    return 'Oops! Something went wrong. Please try again.';
  }
}

// Handle sending a message
async function handleSendMessage() {
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  addMessage('user', userMessage);
  currentSession.push({ role: 'user', text: userMessage });
  userInput.value = '';

  const botResponse = await fetchGPTResponse(userMessage);
  addMessage('gpt', botResponse);
  currentSession.push({ role: 'gpt', text: botResponse });
}

// Save the session to history on page unload
window.addEventListener('beforeunload', saveToHistory);

// Event listeners
sendBtn.addEventListener('click', handleSendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});
