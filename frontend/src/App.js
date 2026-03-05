import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to the ByteCraft Career Simulator! What programming skills do you currently have? (e.g., Python, React)' }
  ]);
  const [input, setInput] = useState('');
  
  // New state variables to track the conversation
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState({ skills: '', academicLevel: '', studyHours: '' });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Show user message
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Conversational Logic Flow
    if (step === 1) {
      setUserData({ ...userData, skills: input });
      setMessages(prev => [...prev, { sender: 'bot', text: 'Great. What is your current academic level? (e.g., Sophomore, Junior, Senior)' }]);
      setStep(2);
    } 
    else if (step === 2) {
      setUserData({ ...userData, academicLevel: input });
      setMessages(prev => [...prev, { sender: 'bot', text: 'Got it. How many hours per week can you dedicate to learning new skills?' }]);
      setStep(3);
    } 
    else if (step === 3) {
      const finalData = { ...userData, studyHours: input };
      setMessages(prev => [...prev, { sender: 'bot', text: 'Analyzing your profile and running the simulation... ⚙️' }]);
      setStep(4); // Prevent further typing while loading

      try {
        // Send all collected data to Django
        const response = await axios.post('http://127.0.0.1:8000/api/chat/', finalData);
        setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
      } catch (error) {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to the simulation engine.' }]);
      }
      
      // Reset the step so they can run another simulation later
      setStep(1); 
    }
  };

  return (
    <div className="App">
      <header className="chat-header">
        <h1>ByteCraft Career Simulator</h1>
      </header>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
          </div>
        ))}
      </div>
      <form className="chat-input-area" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={step === 4 ? "Simulating..." : "Type your answer here..."}
          disabled={step === 4} 
        />
        <button type="submit" disabled={step === 4}>Send</button>
      </form>
    </div>
  );
}

export default App;