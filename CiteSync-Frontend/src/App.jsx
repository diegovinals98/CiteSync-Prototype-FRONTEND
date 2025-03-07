import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '')
  const [papers, setPapers] = useState([])
  const [selectedPaper, setSelectedPaper] = useState(null)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [loading, setLoading] = useState(false)

  // Guardar userId en localStorage cuando cambie
  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId)
    }
  }, [userId])

  // Función para crear un nuevo paper
  const createNewPaper = async () => {
    if (!userId) {
      alert('Por favor, introduce un ID de usuario')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:2727/new_paper/?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      if (data.paper_id) {
        const newPaper = {
          id: data.paper_id,
          created: new Date().toLocaleString()
        }
        setPapers([...papers, newPaper])
        setSelectedPaper(newPaper)
        setChatHistory([])
      }
    } catch (error) {
      console.error('Error al crear nuevo paper:', error)
      alert('Error al crear nuevo paper')
    } finally {
      setLoading(false)
    }
  }

  // Función para enviar mensaje
  const sendMessage = async () => {
    if (!userId || !selectedPaper || !message.trim()) {
      alert('Por favor, completa todos los campos')
      return
    }

    // Añadir mensaje del usuario al historial
    const userMessage = { role: 'user', content: message }
    setChatHistory([...chatHistory, userMessage])
    
    setLoading(true)
    try {
      const response = await fetch('http://localhost:2727/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          paper_id: selectedPaper.id,
          message: message
        }),
      })

      const data = await response.json()
      
      // Añadir respuesta del asistente al historial
      if (data.response) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error)
      alert('Error al enviar mensaje')
      // Añadir mensaje de error al historial
      setChatHistory(prev => [...prev, { role: 'error', content: 'Error al comunicarse con el servidor' }])
    } finally {
      setLoading(false)
      setMessage('')
    }
  }

  return (
    <div className="app-container">
      <header>
        <h1>CiteSync Prototype</h1>
      </header>
      
      <div className="user-section">
        <input 
          type="text" 
          placeholder="Tu ID de usuario" 
          value={userId} 
          onChange={(e) => setUserId(e.target.value)} 
        />
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <h2>Tus Papers</h2>
          <button 
            className="new-paper-btn" 
            onClick={createNewPaper}
            disabled={loading || !userId}
          >
            Nuevo Paper
          </button>
          
          <div className="papers-list">
            {papers.map(paper => (
              <div 
                key={paper.id} 
                className={`paper-item ${selectedPaper?.id === paper.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedPaper(paper)
                  setChatHistory([]) // Resetear historial al cambiar de paper
                }}
              >
                <div className="paper-title">Paper {paper.id.substring(0, 8)}...</div>
                <div className="paper-date">{paper.created}</div>
              </div>
            ))}
            {papers.length === 0 && (
              <div className="no-papers">No hay papers. ¡Crea uno nuevo!</div>
            )}
          </div>
        </div>
        
        <div className="chat-container">
          {selectedPaper ? (
            <>
              <div className="chat-header">
                <h2>Conversación - Paper {selectedPaper.id.substring(0, 8)}...</h2>
              </div>
              
              <div className="chat-messages">
                {chatHistory.length === 0 ? (
                  <div className="welcome-message">
                    <p>¡Bienvenido! Comienza describiendo el tema de tu paper.</p>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="message assistant loading">
                    <div className="message-content">Escribiendo...</div>
                  </div>
                )}
              </div>
              
              <div className="chat-input">
                <textarea
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                ></textarea>
                <button 
                  onClick={sendMessage} 
                  disabled={loading || !message.trim()}
                >
                  Enviar
                </button>
              </div>
            </>
          ) : (
            <div className="no-paper-selected">
              <p>Selecciona un paper existente o crea uno nuevo para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
