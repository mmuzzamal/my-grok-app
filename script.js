// DOM Elements
const chatButton = document.getElementById('chatButton');
const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesArea = document.getElementById('messagesArea');
const notificationDot = document.getElementById('notificationDot');

// State
let isOpen = false;
let isFirstMessage = true;

// Toggle chat
chatButton.addEventListener('click', () => {
    isOpen = !isOpen;
    
    if (isOpen) {
        chatContainer.classList.add('active');
        chatButton.classList.add('active');
        notificationDot.style.display = 'none';
        messageInput.focus();
    } else {
        chatContainer.classList.remove('active');
        chatButton.classList.remove('active');
    }
});

// Input handling
messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim().length === 0;
});

// Send message
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Remove welcome message if it's the first message
    if (isFirstMessage) {
        const welcomeMsg = messagesArea.querySelector('.welcome-message');
        if (welcomeMsg) welcomeMsg.remove();
        isFirstMessage = false;
    }

    // Add user message
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    sendButton.disabled = true;
    
    // Show typing indicator
    const typingElement = showTypingIndicator();
    
    try {
        // Send to API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Remove typing indicator
        typingElement.remove();
        
        // Add bot response
        if (data.reply) {
            addMessage(data.reply, 'bot');
        } else {
            addMessage('Sorry, I couldn\'t process that. Please try again.', 'bot');
        }
        
    } catch (error) {
        console.error('Error:', error);
        typingElement.remove();
        addMessage('Sorry, something went wrong. Please try again later.', 'bot');
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = text;
    
    messageDiv.appendChild(bubbleDiv);
    messagesArea.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;
    messagesArea.appendChild(typingDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
    return typingDiv;
}

// Send button click
sendButton.addEventListener('click', sendMessage);

// Enter key to send
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Hide notification dot after 3 seconds
setTimeout(() => {
    notificationDot.style.display = 'none';
}, 3000);
