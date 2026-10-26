import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginApi, registerApi } from '../services/api';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AuthPage() {
  const { loginUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await loginApi({ email, password });
        loginUser(res.data.access_token, res.data.user);
      } else {
        const res = await registerApi({ email, password, full_name: fullName });
        loginUser(res.data.access_token, res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Đã xảy ra lỗi trong quá trình xác thực.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Left Side: Brand & Value Prop */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-900 p-8 sm:p-10 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-indigo-100 border border-white/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền Tảng AI Học Tập SaaS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Biến bài giảng dài thành ý chính cô đọng.
            </h1>
            <p className="mt-4 text-indigo-200 text-sm leading-relaxed">
              Tự động tóm tắt video YouTube, trích xuất giáo trình PDF/Word, kiến tạo sơ đồ tư duy Mindmap và hỏi đáp tương tác trực tiếp với tài liệu.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {[
              'Tóm tắt video YouTube tự động',
              'Đọc và phân tích tài liệu PDF & Word',
              'Trực quan hóa sơ đồ tư duy (Mindmap)',
              'Trợ lý hỏi đáp trực tiếp (Chat with Doc)',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-2.5 text-xs text-indigo-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`pb-3 text-sm font-bold flex-1 transition-all ${
                isLogin
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`pb-3 text-sm font-bold flex-1 transition-all ${
                !isLogin
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none rounded-xl text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email sinh viên / cá nhân</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@university.edu.vn"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 focus:outline-none rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{loading ? 'Đang xử lý...' : isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Hệ thống đồ án tốt nghiệp chuẩn SaaS – Hỗ trợ Gemini 1.5/2.0 Flash
          </p>
        </div>
      </div>
    </div>
  );
}
