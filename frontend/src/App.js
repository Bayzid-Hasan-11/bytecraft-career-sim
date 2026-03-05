import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to the **ByteCraft Career Simulator!** What programming skills do you currently have? *(e.g., Python, React)*' }
  ]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({ skills: '', academicLevel: '', studyHours: '' });
  
  // NEW: State for the typing indicator
  const [isTyping, setIsTyping] = useState(false);
  
  // NEW: Reference to auto-scroll to the bottom
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // NEW: Automatically scroll down whenever messages change or bot is typing
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Show user message
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true); // Turn on typing indicator

    // Artificial delay to make the bot feel human
    setTimeout(async () => {
      if (step === 1) {
        setUserData({ ...userData, skills: input });
        setMessages(prev => [...prev, { sender: 'bot', text: 'Great. What is your current **academic level**? *(e.g., Sophomore, Junior, Senior)*' }]);
        setStep(2);
        setIsTyping(false);
      } 
      else if (step === 2) {
        setUserData({ ...userData, academicLevel: input });
        setMessages(prev => [...prev, { sender: 'bot', text: 'Got it. **How many hours per week** can you dedicate to learning new skills?' }]);
        setStep(3);
        setIsTyping(false);
      } 
      else if (step === 3) {
        const finalData = { ...userData, studyHours: input };
        setMessages(prev => [...prev, { sender: 'bot', text: 'Analyzing your profile and running the simulation... ⚙️' }]);
        setStep(4);
        
        try {
          // Send all collected data to Django
          const response = await axios.post('http://127.0.0.1:8000/api/chat/', finalData);
          setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
        } catch (error) {
          setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to the simulation engine.' }]);
        }
        
        setStep(1); // Reset for next simulation
        setIsTyping(false);
      }
    }, 800); // 800ms delay for UX
  };

  return (
    <div className="App">
      <header className="chat-header">
        <div className="logo-pulse"></div>
        <h1>ByteCraft Engine</h1>
      </header>
      
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.sender}`}>
            {msg.sender === 'bot' && <div className="avatar bot-avatar">🤖</div>}
            <div className="message">
              {/* ReactMarkdown converts our bold/italic tags into real formatting */}
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
            {msg.sender === 'user' && <div className="avatar user-avatar">👤</div>}
          </div>
        ))}
        
        {/* The Typing Indicator Animation */}
        {isTyping && (
          <div className="message-wrapper bot">
            <div className="avatar bot-avatar">🤖</div>
            <div className="message typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        
        {/* Invisible div to snap the scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isTyping ? "Engine is processing..." : "Type your answer here..."}
          disabled={isTyping || step === 4} 
        />
        <button type="submit" disabled={isTyping || step === 4}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
          </svg>
        </button>
      </form>
    </div>
  );
}

export default App;