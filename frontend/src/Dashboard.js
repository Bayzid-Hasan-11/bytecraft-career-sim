import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard() {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to the **ByteCraft AI Engine!** Tell me about your skills, academic level, and study hours in a natural sentence.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Basic security: Kick them back to login if they don't have a token
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
    }
    scrollToBottom();
  }, [messages, isTyping, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
        skills: input,
        studyHours: 15,
        academicLevel: 'Student'
      });
      
      const botReply = { sender: 'bot', text: response.data.reply, chartData: response.data.chartData };
      setMessages(prev => [...prev, botReply]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to the AI Simulation Engine.' }]);
    }
    setIsTyping(false);
  };

  const renderChart = (chartData) => {
    if (!chartData || !chartData.missingSkills || chartData.missingSkills.length === 0) return null;
    const monthsPerSkill = (chartData.monthsNeeded / chartData.missingSkills.length).toFixed(1);
    const data = chartData.missingSkills.map(skill => ({ name: skill, Months: parseFloat(monthsPerSkill) }));

    return (
      <div className="chart-container" style={{ width: '100%', height: 250, marginTop: '20px', backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px' }}>
        <h4 style={{ color: '#10b981', marginBottom: '15px', textAlign: 'center' }}>
          Learning Roadmap: {chartData.career} ({chartData.matchPercentage}% Match)
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
            <Bar dataKey="Months" radius={[0, 4, 4, 0]} animationDuration={1500}>
              {data.map((entry, index) => ( <Cell key={`cell-${index}`} fill={'#10b981'} /> ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="chat-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-pulse"></div>
          <h1>ByteCraft AI Engine</h1>
        </div>
        <button onClick={handleLogout} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </header>
      
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.sender}`}>
            {msg.sender === 'bot' && <div className="avatar bot-avatar">🤖</div>}
            <div className="message" style={{ width: msg.chartData && msg.chartData.missingSkills && msg.chartData.missingSkills.length > 0 ? '100%' : 'auto' }}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
              {msg.chartData && renderChart(msg.chartData)}
            </div>
            {msg.sender === 'user' && <div className="avatar user-avatar">👤</div>}
          </div>
        ))}
        {isTyping && (
          <div className="message-wrapper bot"><div className="avatar bot-avatar">🤖</div><div className="message typing-indicator"><span></span><span></span><span></span></div></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isTyping ? "AI is processing..." : "Describe your skills..."} disabled={isTyping} />
        <button type="submit" disabled={isTyping}><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/></svg></button>
      </form>
    </div>
  );
}

export default Dashboard;