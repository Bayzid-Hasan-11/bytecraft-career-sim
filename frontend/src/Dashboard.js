import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Dashboard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    semester: '',
    hours: '',
    skills: []
  });
  
  // You can easily add or remove skills here to match your database
  const availableSkills = ['Python', 'Java', 'SQL', 'React', 'HTML', 'CSS', 'Figma', 'Django', 'JavaScript', 'C++'];

  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome to the **ByteCraft AI Engine!** Let\'s build your profile. Please answer the questions below to initialize the simulation.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      navigate('/login');
    }
    scrollToBottom();
  }, [messages, isTyping, step, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // 2. ADDED: Wizard Handlers
  const handleSkillToggle = (skill) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  const handleNextStep = () => {
    if (step === 1 && !formData.semester) return alert("Please select a semester.");
    if (step === 2 && (!formData.hours || parseFloat(formData.hours) <= 0)) return alert("Please enter a valid number of study hours (must be greater than 0).");
    if (step === 3 && formData.skills.length === 0) return alert("Please select at least one skill.");

    // Visually add the user's choice to the chat history
    if (step === 1) setMessages(prev => [...prev, { sender: 'user', text: `Semester: ${formData.semester}` }]);
    if (step === 2) setMessages(prev => [...prev, { sender: 'user', text: `Study Time: ${formData.hours} hours/week` }]);
    if (step === 3) setMessages(prev => [...prev, { sender: 'user', text: `Skills: ${formData.skills.join(', ')}` }]);

    setStep(prev => prev + 1);
  };

  // 3. ADDED: Trigger AI when wizard finishes
  useEffect(() => {
    if (step === 4) {
      const constructedMessage = `I am a ${formData.semester} student. I can study ${formData.hours} hours a week. I know ${formData.skills.join(', ')}.`;
      sendToAI(constructedMessage);
    }
  }, [step]);

  // 4. MODIFIED: Separated API logic from form submission
  const sendToAI = async (textPayload) => {
    setIsTyping(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
        skills: textPayload,
        studyHours: formData.hours ? parseInt(formData.hours) : 15,
        academicLevel: formData.semester || 'Student'
      });
      
      const botReply = { sender: 'bot', text: response.data.reply, chartData: response.data.chartData };
      setMessages(prev => [...prev, botReply]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Error connecting to the AI Simulation Engine.' }]);
    }
    setIsTyping(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || step < 4) return;

    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    sendToAI(input);
    setInput('');
  };

const renderChart = (chartData) => {
    // We now look for the new detailed array sent from Django
    if (!chartData || !chartData.missingSkillsData || chartData.missingSkillsData.length === 0) return null;
    
    // Django already did the perfect math, so we just pass the data straight to the chart!
    const data = chartData.missingSkillsData;

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

  // Common styles for wizard elements
  const inputStyle = { padding: '10px', margin: '10px 0', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: 'white', width: '100%' };
  const btnStyle = { padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };

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

        {/* --- ADDED: GUIDED WIZARD UI --- */}
        {step === 1 && (
          <div className="message-wrapper bot">
            <div className="avatar bot-avatar">🤖</div>
            <div className="message interactive-bubble">
              <p style={{marginBottom: '10px', color: '#94a3b8'}}>What is your current academic semester?</p>
              <select value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} style={inputStyle}>
                <option value="">Select Semester...</option>
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
              </select>
              <button onClick={handleNextStep} style={btnStyle}>Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="message-wrapper bot">
            <div className="avatar bot-avatar">🤖</div>
            <div className="message interactive-bubble">
              <p style={{marginBottom: '10px', color: '#94a3b8'}}>How many hours per week can you dedicate to studying new skills?</p>
              <input type="number" placeholder="e.g., 15" value={formData.hours} onChange={(e) => setFormData({...formData, hours: e.target.value})} style={inputStyle} />
              <button onClick={handleNextStep} style={btnStyle}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="message-wrapper bot">
            <div className="avatar bot-avatar">🤖</div>
            <div className="message interactive-bubble">
              <p style={{marginBottom: '10px', color: '#94a3b8'}}>Select the technical skills you already know:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {availableSkills.map(skill => (
                  <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
                    <input type="checkbox" checked={formData.skills.includes(skill)} onChange={() => handleSkillToggle(skill)} style={{ cursor: 'pointer' }} />
                    {skill}
                  </label>
                ))}
              </div>
              <button onClick={handleNextStep} style={btnStyle}>Run Simulation</button>
            </div>
          </div>
        )}

        {isTyping && (
          <div className="message-wrapper bot"><div className="avatar bot-avatar">🤖</div><div className="message typing-indicator"><span></span><span></span><span></span></div></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleManualSubmit}>
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={step < 4 ? "Please complete the setup above..." : isTyping ? "AI is processing..." : "Describe additional skills or ask a question..."} disabled={isTyping || step < 4} />
        <button type="submit" disabled={isTyping || step < 4}><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/></svg></button>
      </form>
    </div>
  );
}

export default Dashboard;