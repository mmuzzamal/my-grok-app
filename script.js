// script.js - AI Chatbot Widget JavaScript
/**
 * This script handles the chatbot UI and communicates with the backend API
 * The API endpoint is automatically handled by Vercel serverless functions
 */

// Configuration - API endpoint (automatically points to your Vercel app)
const API_BASE_URL = window.location.origin; // Uses current domain
const CHAT_ENDPOINT = `${API_BASE_URL}/api/chat`;

// DOM elements
const chatbotIcon = document.getElementById('chatbot-icon');
const chatbotContainer = document.getElementById('chatbot-container');
const closeChatbot = document.getElementById('close-chatbot');
const messagesContainer = document.getElementById('chatbot-messages');
const messageInput = document.getElementById('chatbot-input');
const sendButton = document.getElementById('send-button');
const typingIndicator = document.getElementById('typing-indicator');

// State management
let isOpen = false;
let isLoading = false;

/**
 * Initialize the chatbot when page loads
 */
function initChatbot() {
    console.log('Initializing chatbot...');
    console.log('API Endpoint:', CHAT_ENDPOINT);
    
    // Add event listeners
    chatbotIcon.addEventListener('click', toggleChatbot);
    closeChatbot.addEventListener('click', closeChatbotHandler);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', handleKeyDown);
    messageInput.addEventListener('input', autoResizeTextarea);
    
    console.log('Chatbot initialized successfully');
}

/**
 * Toggle chatbot visibility
 */
function toggleChatbot() {
    if (isOpen) {
        closeChatbotHandler();
    } else {
        openChatbot();
    }
}

/**
 * Open chatbot
 */
function openChatbot() {
    chatbotContainer.classList.add('show');
    isOpen = true;
    messageInput.focus();
    scrollToBottom();
    console.log('Chatbot opened');
}

/**
 * Close chatbot
 */
function closeChatbotHandler() {
    chatbotContainer.classList.remove('show');
    isOpen = false;
    console.log('Chatbot closed');
}

/**
 * Handle Enter key in textarea
 */
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Auto-resize textarea based on content
 */
function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 100) + 'px';
}

/**
 * Send message to chatbot
 */
async function sendMessage() {
    const message = messageInput.value.trim();
    
    // Validation
    if (!message || isLoading) {
        return;
    }

    if (message.length > 1000) {
        addMessage('Message is too long. Please keep it under 1000 characters.', 'error');
        return;
    }

    console.log('Sending message:', message);

    // Update UI state
    isLoading = true;
    sendButton.disabled = true;
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        console.log('Making API request to:', CHAT_ENDPOINT);
        
        // Send request to backend
        const response = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                max_tokens: 200
            })
        });

        console.log('API response status:', response.status);

        // Parse response
        const data = await response.json();
        console.log('API response data:', data);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (data.success && data.response) {
            // Add bot response
            addMessage(data.response, 'bot');
        } else {
            // Handle error
            const errorMsg = data.error || 'Sorry, I encountered an error. Please try again.';
            addMessage(errorMsg, 'error');
            console.error('API Error:', data.error);
        }
        
    } catch (error) {
        console.error('Network error:', error);
        hideTypingIndicator();
        
        // Add error message
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            addMessage('Unable to connect to the server. Please check your internet connection.', 'error');
        } else {
            addMessage('Sorry, something went wrong. Please try again later.', 'error');
        }
    } finally {
        // Reset UI state
        isLoading = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
}

/**
 * Add message to chat interface
 */
function addMessage(content, type) {
    console.log('Adding message:', { content, type });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Create message structure with avatar
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    // Add appropriate avatar based on message type
    if (type === 'user') {
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
            </svg>
        `;
    } else {
        avatarDiv.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 7V9C19 10.1 18.1 11 17 11V13H17C17 14.1 16.1 15 15 15V17H9V15C7.9 15 7 14.1 7 13H7V11C5.9 11 5 10.1 5 9V7H3V9C3 11.2 4.8 13 7 13V16C7 17.1 7.9 18 9 18H15C16.1 18 17 17.1 17 16V13C19.2 13 21 11.2 21 9ZM16 8C16 6.9 15.1 6 14 6H10C8.9 6 8 6.9 8 8V10C8 11.1 8.9 12 10 12H14C15.1 12 16 11.1 16 10V8ZM10.5 9C10.5 8.4 11 8 11.5 8S12.5 8.4 12.5 9 12 10 11.5 10 10.5 9.6 10.5 9ZM13.5 9C13.5 8.4 14 8 14.5 8S15.5 8.4 15.5 9 15 10 14.5 10 13.5 9.6 13.5 9Z"/>
            </svg>
        `;
    }
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    // Insert before typing indicator
    messagesContainer.insertBefore(messageDiv, typingIndicator);
    
    // Auto-scroll to bottom
    scrollToBottom();
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    typingIndicator.classList.add('show');
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    typingIndicator.classList.remove('show');
}

/**
 * Scroll messages to bottom
 */
function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

/**
 * Handle clicks outside chatbot to potentially close it
 */
document.addEventListener('click', function(event) {
    if (isOpen && 
        !chatbotContainer.contains(event.target) && 
        !chatbotIcon.contains(event.target)) {
        // Uncomment the line below if you want clicking outside to close the chatbot
        // closeChatbotHandler();
    }
});

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', initChatbot);

/**
 * Handle window resize for mobile responsiveness
 */
window.addEventListener('resize', function() {
    if (isOpen) {
        scrollToBottom();
    }
});

/**
 * Debug function to test API connection
 */
function testConnection() {
    console.log('Testing API connection...');
    fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Hello, testing connection',
            max_tokens: 50
        })
    })
    .then(response => {
        console.log('Test response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Test response data:', data);
    })
    .catch(error => {
        console.error('Test connection error:', error);
    });
}

// Expose test function for debugging (remove in production)
window.testConnection = testConnection;
