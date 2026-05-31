import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api';
import MobileHeader from '../../components/layout/MobileHeader';
import { Send, Loader2, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'T-500 price kya hai?', 'Delivery kitne din?',
  'Best machine under ₹1L', 'Mug press ke specs?', 'Warranty kitni hai?'
];

export default function MobileChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Namaste! 👋\n\nMain aapki poori machine catalog jaanta hoon.\n\nKuch bhi puchho — prices, specs, delivery, warranty — Hindi ya English mein jawab dunga!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { data } = await api.post('/chat', { message: msg, conversation_history: newMessages.slice(-12) });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Service unavailable. Check API key.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally { setLoading(false); }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-app)' }}>
      <MobileHeader
        title="AI Assistant"
        rightAction={
          <button onClick={() => setMessages([{ role: 'assistant', content: 'Namaste! 👋\n\nMain aapki poori machine catalog jaanta hoon. Kuch bhi puchho!' }])}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Trash2 size={20} color="var(--text-secondary)" />
          </button>
        }
      />

      {/* Online indicator */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'block' }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Online · Powered by Claude AI</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', WebkitOverflowScrolling: 'touch' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isAI = msg.role === 'assistant';
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', justifyContent: isAI ? 'flex-start' : 'flex-end', marginBottom: 14, gap: 8 }}>
                {isAI && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                    <Zap size={15} color="white" />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '12px 14px',
                  borderRadius: isAI ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                  background: isAI ? 'var(--bg-surface)' : 'var(--brand-primary)',
                  color: isAI ? 'var(--text-primary)' : 'white',
                  fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  boxShadow: isAI ? 'var(--shadow-sm)' : '0 4px 14px rgba(232,80,10,0.3)',
                  border: isAI ? '1px solid var(--border)' : 'none',
                  fontFamily: 'var(--font-primary)',
                }}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="white" />
              </div>
              <div style={{ background: 'var(--bg-surface)', borderRadius: '4px 18px 18px 18px', padding: '14px 18px', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <span key={i} className="typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--brand-primary)', display: 'block', animationDelay: `${i*150}ms` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 2 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', background: 'var(--bg-app)', flexShrink: 0 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => send(s)} disabled={loading}
              style={{ whiteSpace: 'nowrap', padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600, flexShrink: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
        padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0,
      }}>
        <div style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: 22, padding: '9px 14px', display: 'flex', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input} onChange={handleTextareaInput} onKeyDown={handleKeyDown}
            placeholder="Hindi ya English mein likho..."
            rows={1}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 16, color: 'var(--text-primary)', resize: 'none', outline: 'none', fontFamily: 'var(--font-primary)', lineHeight: 1.4, maxHeight: 100 }}
          />
        </div>
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: input.trim() && !loading ? 'var(--brand-primary)' : 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 200ms', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}>
          {loading
            ? <Loader2 size={18} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            : <Send size={18} color={input.trim() ? 'white' : 'var(--text-muted)'} />}
        </button>
      </div>
    </div>
  );
}
