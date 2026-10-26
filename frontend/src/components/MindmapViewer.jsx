import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Network, Copy, Check, AlertCircle } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
  mindmap: {
    padding: 16,
    useMaxWidth: true,
  }
});

export default function MindmapViewer({ code }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;

    let isMounted = true;
    setError(null);

    const renderDiagram = async () => {
      try {
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        // Clean code: remove markdown code fences if wrapped
        let cleanCode = code.trim();
        cleanCode = cleanCode.replace(/^```(?:mermaid)?/i, '').replace(/```$/, '').trim();

        const { svg } = await mermaid.render(uniqueId, cleanCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Lỗi render Mermaid Mindmap:', err);
        if (isMounted) {
          setError('Không thể kết xuất sơ đồ tư duy đồ họa do cú pháp chưa tương thích.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-slate-700">
          <Network className="w-5 h-5 text-indigo-600" />
          <span className="font-bold text-sm">Sơ Đồ Tư Duy (AI Mindmap)</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-2xs transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép' : 'Sao chép mã'}</span>
        </button>
      </div>

      {/* Render Area */}
      <div className="flex-1 p-6 flex items-center justify-center min-h-[420px] bg-slate-50/50 overflow-auto">
        {error ? (
          <div className="max-w-md p-5 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <p className="text-xs text-rose-600 mt-1">Dưới đây là mã nguồn thô của sơ đồ:</p>
            <pre className="mt-3 p-3 bg-white rounded-lg text-left text-xs font-mono text-slate-700 border border-rose-100 overflow-x-auto max-h-48">
              {code}
            </pre>
          </div>
        ) : svgContent ? (
          <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:h-auto transition-transform"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="flex items-center space-x-2 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang dựng sơ đồ tư duy...</span>
          </div>
        )}
      </div>
    </div>
  );
}
