import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { Send, Loader2, Trash2, Zap, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_QUESTIONS = [
  'T-500 ka price kya hai?', 'Best machine under ₹1L?',
  'Delivery time kitni hai?', 'Combo machine ke fayde kya hain?', '5 machines bulk discount?'
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, animation: 'fadeInUp 200ms ease' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Zap size={16} color="white" />
      </div>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0 12px 12px 12px', padding: '12px 16px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0,1,2].map(i => (
          <span key={i} className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)', display: 'block', animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ msg, index }) {
  const isAI = msg.role === 'assistant';
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2, delay: 0.05 }}
      style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: isAI ? 'flex-start' : 'flex-end' }}>
      {isAI && (
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
          <Zap size={16} color="white" />
        </div>
      )}
      <div style={{
        maxWidth: '75%', padding: '12px 16px', borderRadius: isAI ? '0 12px 12px 12px' : '12px 0 12px 12px',
        background: isAI ? 'var(--bg-surface)' : 'var(--brand-primary)',
        color: isAI ? 'var(--text-primary)' : 'white',
        border: isAI ? '1px solid var(--border)' : 'none',
        boxShadow: isAI ? 'var(--shadow-sm)' : '0 4px 12px rgba(232,80,10,0.3)',
        fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
        fontFamily: 'var(--font-primary)',
      }}>
        {msg.content.replace(/₹[\d,]+/g, (m) => m)}
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! 🙏 Main aapki poori machine catalog jaanta hoon.\n\nKuch bhi puchho — prices, specs, delivery time, warranty, comparison — main Hindi ya English mein jawab dunga!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { data } = await api.post('/chat', { message: msg, conversation_history: newMessages.slice(-12) });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Chat service unavailable. Check your API key in .env file.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>AI Sales Assistant</h3>
          <p style={{ fontSize: 12, color: 'var(--status-won)', margin: 0, fontWeight: 600 }}>● Online — Apni team ka 24/7 expert</p>
        </div>
        <button onClick={() => setMessages([{ role: 'assistant', content: 'Namaste! 🙏 Main aapki poori machine catalog jaanta hoon.\n\nKuch bhi puchho — prices, specs, delivery time, warranty, comparison!' }])}
          className="btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>
          <Trash2 size={14} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 0', background: 'var(--bg-app)' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => <ChatBubble key={i} msg={msg} index={i} />)}
          {loading && <TypingIndicator />}
        </AnimatePresence>
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Quick chips */}
      {messages.length <= 2 && (
        <div style={{ padding: '10px 20px', background: 'var(--bg-app)', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
          {QUICK_QUESTIONS.map((q, i) => (
            <button key={i} onClick={() => send(q)} disabled={loading}
              style={{ whiteSpace: 'nowrap', fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0, transition: 'all 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 14, padding: '8px 8px 8px 16px', transition: 'border-color 150ms' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <textarea ref={el => { textareaRef.current = el; inputRef.current = el; }} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
            placeholder="Machine ke baare mein kuch bhi puchho... (Enter to send)"
            rows={1}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: 'var(--text-primary)', resize: 'none', outline: 'none', fontFamily: 'var(--font-primary)', lineHeight: 1.5, minHeight: 28, maxHeight: 120, overflowY: 'auto' }} />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            style={{ width: 38, height: 38, borderRadius: 10, background: input.trim() && !loading ? 'var(--brand-primary)' : 'var(--border)', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms', flexShrink: 0 }}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'white' }} /> : <Send size={16} color={input.trim() ? 'white' : 'var(--text-muted)'} />}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', margin: '6px 0 0' }}>Powered by Claude AI · Hindi & English supported</p>
      </div>
    </div>
  );
}
