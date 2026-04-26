import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas'; 
import { jsPDF } from 'jspdf';         
import './App.css';

const InteractiveRoadmap = ({ matches }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef(null); 

  const [courses, setCourses] = useState([]);
  const [isGeneratingSyllabus, setIsGeneratingSyllabus] = useState(false);

  useEffect(() => {
    setCourses([]);
  }, [selectedIndex]);

  const activeMatch = matches[selectedIndex];

  if (!activeMatch) return null;

  const isPerfectMatch = !activeMatch.missingSkillsData || activeMatch.missingSkillsData.length === 0;

  const handleGenerateSyllabus = async () => {
    setIsGeneratingSyllabus(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/generate-courses/', {
        career: activeMatch.career,
        missingSkills: activeMatch.missingTextList
      });
      setCourses(res.data.courses || []);
    } catch (error) {
      alert("Error generating syllabus from AI.");
    }
    setIsGeneratingSyllabus(false);
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true); 
    
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ByteCraft_Roadmap_${activeMatch.career.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      alert("Error generating PDF.");
    }
    
    setIsExporting(false);
  };

  return (
    <div className="interactive-roadmap-container" style={{ marginTop: '20px', backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px' }}>
      
      {/* 1. The Clickable Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {matches.map((match, index) => (
          <button 
            key={index} 
            onClick={() => setSelectedIndex(index)}
            style={{
              padding: '8px 16px',
              backgroundColor: selectedIndex === index ? '#10b981' : '#334155',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: selectedIndex === index ? 'bold' : 'normal',
              transition: '0.2s',
              boxShadow: selectedIndex === index ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none'
            }}
          >
            {match.career} ({match.matchPercentage}%)
          </button>
        ))}
      </div>

      {/* 2. The Content area we want to capture in the PDF */}
      <div ref={printRef} style={{ padding: '20px', backgroundColor: '#0f172a', borderRadius: '8px' }}>
        
        {/* Dynamic Header for the PDF */}
        <h2 style={{ color: '#10b981', textAlign: 'center', marginBottom: '15px', display: isExporting ? 'block' : 'none' }}>
          ByteCraft AI Simulation: {activeMatch.career}
        </h2>

        {isPerfectMatch ? (
          <div style={{ textAlign: 'center', padding: '20px', border: '1px solid #10b981', borderRadius: '8px' }}>
            <h3 style={{ color: '#10b981', marginBottom: '10px' }}>🎉 100% Skill Match!</h3>
            <p style={{ color: '#f8fafc', fontSize: '0.95rem' }}>
              You already have all the core skills mapped for the <strong>{activeMatch.career}</strong> role. You are ready to start building a portfolio!
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', marginBottom: '15px' }}>
              To become a <strong>{activeMatch.career}</strong>, you need to learn: {activeMatch.missingTextList.join(', ')}. 
              Estimated time: <strong>{activeMatch.totalMonths} months</strong>.
            </p>

            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeMatch.missingSkillsData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white' }} />
                  <Bar dataKey="Months" radius={[0, 4, 4, 0]} animationDuration={500}>
                    {activeMatch.missingSkillsData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={'#10b981'} /> ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* NEW: The Dynamic Syllabus Section */}
            <div style={{ marginTop: '30px' }}>
              {courses.length === 0 ? (
                <div style={{ textAlign: 'center' }}>
                  <button 
                    onClick={handleGenerateSyllabus}
                    disabled={isGeneratingSyllabus}
                    style={{
                      padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                      border: 'none', borderRadius: '6px', cursor: isGeneratingSyllabus ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold', transition: '0.2s', width: '100%'
                    }}
                  >
                    {isGeneratingSyllabus ? '🤖 AI is curating your syllabus...' : '📚 Generate Dynamic Syllabus'}
                  </button>
                </div>
              ) : (
                <div>
                  <h3 style={{ color: '#3b82f6', marginBottom: '15px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    Recommended Learning Path
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {courses.map((course, idx) => {
                  
                      const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(course.title)}`;
                      
                      return (
                        <a 
                          key={idx} 
                          href={youtubeSearchUrl}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ 
                            backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', 
                            borderLeft: '4px solid #ef4444', display: 'flex', justifyContent: 'space-between', 
                            alignItems: 'center', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s ease-in-out'
                          }}
                          
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div>
                            <h4 style={{ color: 'white', margin: '0 0 5px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              ▶️ {course.title}
                            </h4>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                              Platform: <strong>{course.platform}</strong>
                            </span>
                          </div>
                          <div style={{ backgroundColor: '#0f172a', padding: '5px 10px', borderRadius: '4px', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            ~{course.estimated_hours} Hours
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* END Dynamic Syllabus Section */}
          </>
        )}
      </div>

      {/* 3. The Export Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#10b981',
            border: '2px solid #10b981',
            borderRadius: '6px',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: '0.2s'
          }}
        >
          {isExporting ? 'Generating Document...' : '📄 Download Roadmap (PDF)'}
        </button>
      </div>

    </div>
  );
};

function Dashboard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    semester: '',
    hours: '',
    skills: []
  });
  
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

    if (step === 1) setMessages(prev => [...prev, { sender: 'user', text: `Semester: ${formData.semester}` }]);
    if (step === 2) setMessages(prev => [...prev, { sender: 'user', text: `Study Time: ${formData.hours} hours/week` }]);
    if (step === 3) setMessages(prev => [...prev, { sender: 'user', text: `Skills: ${formData.skills.join(', ')}` }]);

    setStep(prev => prev + 1);
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsTyping(true); 

    const uploadData = new FormData();
    uploadData.append('resume', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/upload-resume/', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const foundSkills = response.data.skills || [];
      
      const formattedSkills = foundSkills.map(skill => {
        const match = availableSkills.find(a => a.toLowerCase() === skill.toLowerCase());
        return match ? match : skill.charAt(0).toUpperCase() + skill.slice(1);
      });

      setFormData(prev => ({
        ...prev,
        skills: [...new Set([...prev.skills, ...formattedSkills])] 
      }));
      
      alert(`Success! Gemini AI found ${foundSkills.length} skills on your resume.`);
    } catch (error) {
      alert("Error: The AI could not read this PDF.");
    }
    
    setIsTyping(false);
  };

  useEffect(() => {
    if (step === 4) {
      const constructedMessage = `I am a ${formData.semester} student. I can study ${formData.hours} hours a week. I know ${formData.skills.join(', ')}.`;
      sendToAI(constructedMessage);
    }
  }, [step]);

  const sendToAI = async (textPayload) => {
    setIsTyping(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat/', {
        skills: textPayload,
        studyHours: formData.hours ? parseInt(formData.hours) : 15,
        academicLevel: formData.semester || 'Student'
      });
      
      const botReply = { sender: 'bot', text: response.data.reply, matches: response.data.matches };
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
            
            <div className="message" style={{ width: msg.matches && msg.matches.length > 0 ? '100%' : 'auto' }}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
              
              {/* Renders the interactive tabs if the bot sent matches */}
              {msg.matches && msg.matches.length > 0 && (
                <InteractiveRoadmap matches={msg.matches} />
              )}
            </div>
            
            {msg.sender === 'user' && <div className="avatar user-avatar">👤</div>}
          </div>
        ))}

        {/* --- GUIDED WIZARD UI --- */}
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
              
              {/* --- NEW UPLOAD BUTTON UI --- */}
              <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px dashed #10b981', textAlign: 'center' }}>
                <p style={{ color: '#10b981', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>⚡ AI Fast Track</p>
                <input 
                  type="file" 
                  accept=".pdf" 
                  id="resume-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleResumeUpload} 
                />
                <label htmlFor="resume-upload" style={{ cursor: 'pointer', padding: '8px 16px', backgroundColor: '#334155', color: 'white', borderRadius: '6px', fontSize: '0.85rem' }}>
                  📄 Upload Resume (PDF)
                </label>
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '8px' }}>Gemini AI will scan your PDF and auto-fill your skills.</p>
              </div>
              {/* ----------------------------- */}

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