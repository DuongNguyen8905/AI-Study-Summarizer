import React, { useState, useEffect, useRef } from 'react';
import { getChatHistoryApi, sendChatMessageApi } from '../services/api';
import { Send, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChatBox({ documentId, documentTitle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!documentId) return;

    const fetchHistory = async () => {
      setFetching(true);
      try {
        const res = await getChatHistoryApi(documentId);
        setMessages(res.data);
      } catch (err) {
        console.error('Lỗi tải lịch sử chat:', err);
      } finally {
        setFetching(false);
      }
    };

    fetchHistory();
  }, [documentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    // Optimistic update
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await sendChatMessageApi(documentId, query);
      const botMsg = {
        id: res.data.bot_message_id,
        role: 'assistant',
        content: res.data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Lỗi khi gửi câu hỏi:', err);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Xin lỗi, đã xảy ra lỗi khi trao đổi với AI. Vui lòng thử lại.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (prompt) => {
    setInput(prompt);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Trợ Lý AI Học Tập</h3>
            <p className="text-xs text-slate-500 truncate max-w-xs">{documentTitle || 'Hỏi đáp trên tài liệu'}</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
        {fetching ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            <span>Đang tải hội thoại...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Chưa có câu hỏi nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Bạn có thể hỏi bất kỳ thắc mắc nào để AI giải thích cặn kẽ dựa trên tài liệu này.
            </p>

            {/* Quick prompts */}
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {[
                'Tóm tắt bài này trong 3 ý ngắn nhất',
                'Giải thích thuật ngữ trọng tâm trong bài',
                'Lợi ích ứng dụng thực tế của kiến thức này là gì?'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 rounded-full text-slate-600 shadow-2xs transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-violet-600'
                }`}
              >
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-2xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xs">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-200 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Đặt câu hỏi về nội dung tài liệu..."
          disabled={loading}
          className="flex-1 bg-slate-100 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none px-4 py-2.5 rounded-xl text-sm transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
