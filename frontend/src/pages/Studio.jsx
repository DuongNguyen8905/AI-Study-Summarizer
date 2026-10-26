import React, { useState, useEffect } from 'react';
import {
  summarizeYoutubeApi,
  summarizeDocumentApi,
  getDocumentDetailApi
} from '../services/api';
import MindmapViewer from '../components/MindmapViewer';
import ChatBox from '../components/ChatBox';
import {
  Youtube,
  Upload,
  FileText,
  Sparkles,
  BookOpen,
  Network,
  MessageSquare,
  Tag,
  ArrowRight,
  Download,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Studio({ selectedDocId, onClearSelectedDoc }) {
  // Input states
  const [sourceMode, setSourceMode] = useState('youtube'); // 'youtube' or 'file'
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Execution states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results state
  const [docData, setDocData] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('summary'); // 'summary' | 'mindmap' | 'chat'

  // If a document was opened from dashboard
  useEffect(() => {
    if (selectedDocId) {
      loadDocument(selectedDocId);
    }
  }, [selectedDocId]);

  const loadDocument = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await getDocumentDetailApi(id);
      setDocData({
        document_id: res.data.id,
        title: res.data.title,
        source_type: res.data.source_type,
        source_url: res.data.source_url,
        bullet_points: res.data.bullet_points,
        keywords: res.data.keywords || [],
        mindmap_code: res.data.mindmap_code,
      });
      setActiveResultTab('summary');
    } catch (err) {
      setError('Không thể tải thông tin bài học.');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (sourceMode === 'youtube') {
        if (!youtubeUrl.trim()) throw new Error('Vui lòng nhập đường dẫn video YouTube.');
        res = await summarizeYoutubeApi(youtubeUrl);
      } else {
        if (!selectedFile) throw new Error('Vui lòng chọn file tài liệu (.pdf, .docx, .txt).');
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await summarizeDocumentApi(formData);
      }

      setDocData(res.data);
      setActiveResultTab('summary');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Lỗi xử lý tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!docData) return;
    const content = `# ${docData.title}\n\n${docData.bullet_points}\n\n### Từ khóa:\n${docData.keywords.join(', ')}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${docData.title.replace(/\s+/g, '_')}_summary.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* If No Document is active, show the Input Workspace */}
      {!docData ? (
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Không gian học tập AI</span>
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tóm Tắt & Trích Xuất Ý Chính Bài Học
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-lg mx-auto">
              Dán link YouTube bài giảng hoặc tải tài liệu giáo trình để hệ thống tự động cô đọng kiến thức và kiến tạo mindmap.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            {/* Source Mode Switcher */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setSourceMode('youtube'); setError(''); }}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  sourceMode === 'youtube'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Video YouTube</span>
              </button>

              <button
                type="button"
                onClick={() => { setSourceMode('file'); setError(''); }}
                className={`flex items-center justify-center space-x-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  sourceMode === 'file'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>File PDF / Word / Text</span>
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSummarize} className="space-y-6">
              {sourceMode === 'youtube' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Đường dẫn video bài giảng YouTube
                  </label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none rounded-xl text-sm"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    💡 Hỗ trợ mọi định dạng link YouTube có phụ đề tiếng Việt hoặc tiếng Anh.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Tải lên file giáo trình, tài liệu (.pdf, .docx, .txt)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition-all bg-slate-50/50">
                    <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-sm font-bold text-indigo-600 hover:underline"
                    >
                      {selectedFile ? selectedFile.name : 'Bấm vào đây để chọn tệp tài liệu'}
                    </label>
                    <p className="text-xs text-slate-400 mt-1">
                      Kích thước tối đa 20MB. Hệ thống tự động trích xuất nội dung văn bản.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>AI đang phân tích & trích xuất ý chính...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phân Tích & Tóm Tắt Bằng AI</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Document Studio View (Tabs for Summary, Mindmap, Chat) */
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
                <span className="uppercase tracking-wider">
                  {docData.source_type === 'youtube' ? 'Video YouTube' : 'Tài Liệu File'}
                </span>
                <span>•</span>
                <span className="text-indigo-600 font-bold">Hoàn tất phân tích</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                {docData.title}
              </h2>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Báo Cáo (.md)</span>
              </button>

              <button
                onClick={() => {
                  setDocData(null);
                  onClearSelectedDoc?.();
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tóm Tắt Khác</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 space-x-4">
            <button
              onClick={() => setActiveResultTab('summary')}
              className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all ${
                activeResultTab === 'summary'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Ý Chính & Từ Khóa</span>
            </button>

            <button
              onClick={() => setActiveResultTab('mindmap')}
              className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all ${
                activeResultTab === 'mindmap'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Sơ Đồ Tư Duy (Mindmap)</span>
            </button>

            <button
              onClick={() => setActiveResultTab('chat')}
              className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all ${
                activeResultTab === 'chat'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hỏi Đáp Với Tài Liệu (Chat)</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          {activeResultTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bullet Points */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:leading-relaxed prose-li:my-1">
                  <ReactMarkdown>{docData.bullet_points}</ReactMarkdown>
                </div>
              </div>

              {/* Sidebar: Keywords & Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm mb-4">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <span>Từ Khóa Cốt Lõi</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {docData.keywords && docData.keywords.length > 0 ? (
                      docData.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                        >
                          #{kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Không có từ khóa trích xuất.</span>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-6">
                  <h4 className="font-bold text-sm text-indigo-950 mb-1">Cần làm rõ bài học?</h4>
                  <p className="text-xs text-indigo-800/80 mb-4">
                    Chuyển sang tab "Hỏi Đáp" để chat trực tiếp với gia sư AI dựa trên bài này.
                  </p>
                  <button
                    onClick={() => setActiveResultTab('chat')}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <span>Mở khung Chatbot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeResultTab === 'mindmap' && (
            <div className="h-[600px]">
              <MindmapViewer code={docData.mindmap_code} />
            </div>
          )}

          {activeResultTab === 'chat' && (
            <ChatBox documentId={docData.document_id} documentTitle={docData.title} />
          )}
        </div>
      )}
    </div>
  );
}
