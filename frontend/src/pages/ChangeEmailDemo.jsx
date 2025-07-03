import React, { useState } from 'react';
import { adminAPI } from '../api/api';

export default function ChangeEmailDemo() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email) {
      setStatus('❌ Email required')
      return
    }

    setStatus('…updating all users')
    try {
      const json = await adminAPI.changeEmailDemo(email)
      setStatus(`✔️ Updated ${json.modifiedCount} users`)
    } catch (err) {
      setStatus(`❌ ${err.message}`)
    }
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '1rem'
    }}>
      <form onSubmit={handleSubmit} style={{ width: 300 }}>
        <input
          type="email"
          placeholder="New email for everyone"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.5rem',
            marginBottom: '0.5rem'
          }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: 'none',
            background: '#007bff',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Submit
        </button>
      </form>
      {status && <p style={{ position: 'absolute', bottom: 20 }}>{status}</p>}
    </div>
  );
}
