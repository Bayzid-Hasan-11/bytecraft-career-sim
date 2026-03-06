import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // Ask Django for the secure JWT Tokens
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username: username,
        password: password
      });
      
      // Save tokens to browser memory and jump to the dashboard!
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      navigate('/dashboard');
      
    } catch (err) {
      setError('Invalid username or password. Access Denied.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
      <div className="chat-window" style={{ width: '100%', maxWidth: '400px', height: 'auto', padding: '40px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div className="logo-pulse" style={{ width: '20px', height: '20px', marginBottom: '15px' }}></div>
          <h2 style={{ color: '#f8fafc', fontWeight: '600', letterSpacing: '1px' }}>ByteCraft <span style={{ color: '#10b981' }}>Engine</span></h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '5px' }}>Simulation Access Portal</p>
        </div>

        {error && <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={{ padding: '14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ padding: '14px', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: 'white', outline: 'none' }}
            required 
          />
          <button type="submit" style={{ padding: '14px', borderRadius: '8px', backgroundColor: '#10b981', color: '#0f172a', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '10px', transition: '0.2s' }}>
            Initialize Simulation
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;