import React, { useState, useEffect } from 'react';
import { getHistoryApi, deleteDocumentApi } from '../services/api';
import { BookOpen, Youtube, FileText, Trash2, ArrowUpRight, Search, Calendar, AlertCircle } from 'lucide-react';

export default function Dashboard({ onSelectDocument, onNewDocument }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await getHistoryApi();
      setHistory(res.data);
    } catch (err) {
      console.error('Lỗi lấy lịch sử:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài học này khỏi lịch sử?')) return;
    setDeletingId(id);
    try {
      await deleteDocumentApi(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert('Không thể xóa tài liệu này.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = history.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Lịch Sử Bài Học & Tài Liệu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Toàn bộ các video bài giảng và giáo trình bạn đã phân tích, tóm tắt và sinh mindmap.
          </p>
        </div>

        <button
          onClick={onNewDocument}
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition-all self-start sm:self-auto"
        >
          <BookOpen className="w-4 h-4" />
          <span>Tóm Tắt Bài Học Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo tiêu đề bài học..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none rounded-xl text-sm shadow-2xs"
        />
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Đang tải danh sách bài học...</span>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Chưa có bài học nào</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Hãy bắt đầu bằng cách dán link YouTube bài giảng hoặc tải lên file giáo trình PDF/Word.
          </p>
          <button
            onClick={onNewDocument}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            Bắt đầu ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectDocument(item.id)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.source_type === 'youtube'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}
                  >
                    {item.source_type === 'youtube' ? (
                      <Youtube className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>{item.source_type === 'youtube' ? 'YouTube' : 'Tài Liệu File'}</span>
                  </span>

                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    title="Xóa bài học"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex items-center space-x-1 font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Mở xem</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
