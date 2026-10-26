import json
import re
from typing import Dict, Any, List
from google import genai
from google.genai import types
from app.core.config import settings

def get_client() -> genai.Client:
    if not settings.GOOGLE_API_KEY:
        raise ValueError("Chưa thiết lập GOOGLE_API_KEY. Vui lòng kiểm tra file backend/.env")
    return genai.Client(api_key=settings.GOOGLE_API_KEY)


def _get_model_candidates() -> List[str]:
    """Returns candidate models to try in order of preference."""
    base = [settings.GEMINI_MODEL, 'gemini-3.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.8-flash']
    # Preserve order without duplicates
    seen = set()
    result = []
    for m in base:
        if m and m not in seen:
            seen.add(m)
            result.append(m)
    return result


def _clean_json_and_mindmap(response_text: str, title: str) -> Dict[str, Any]:
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", response_text)
    clean_json_str = json_match.group(1) if json_match else response_text

    try:
        data = json.loads(clean_json_str)
        if not data.get("mindmap_code", "").strip().startswith("mindmap"):
            data["mindmap_code"] = f"mindmap\n  root((\"{title}\"))\n    TongQuan\n      YChinh"
        return data
    except Exception:
        return {
            "bullet_points": response_text,
            "keywords": ["Tổng quan", "Bài học", "Kiến thức"],
            "mindmap_code": f"mindmap\n  root((\"{title}\"))\n    YChinh1\n    YChinh2"
        }


def generate_study_summary(content_text: str, title: str) -> Dict[str, Any]:
    """Summarizes text content using Gemini with automatic model fallback."""
    client = get_client()

    prompt = f"""Bạn là một chuyên gia sư phạm và trợ lý học tập AI xuất sắc.
Nhiệm vụ của bạn là phân tích sâu nội dung bài học/tài liệu dưới đây và trích xuất kiến thức cốt lõi.

Tiêu đề tài liệu: {title}
Nội dung tài liệu/bài giảng:
\"\"\"{content_text[:40000]}\"\"\"

Hãy trả về kết quả theo ĐÚNG định dạng JSON sau (không thêm bất kỳ giải thích nào ngoài khối JSON):
```json
{{
  "bullet_points": "## 📌 Tóm Tắt Bài Học\\n\\n### 1. Ý tưởng cốt lõi\\n- Nội dung...\\n\\n### 2. Các điểm trọng tâm\\n- Điểm 1...\\n- Điểm 2...",
  "keywords": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3", "Từ khóa 4", "Từ khóa 5"],
  "mindmap_code": "mindmap\\n  root((\\\"{title}\\\"))\\n    Chu_de_1\\n      Y_con_1\\n      Y_con_2\\n    Chu_de_2\\n      Y_con_3"
}}
```

Quy tắc quan trọng cho `mindmap_code`:
1. Phải bắt đầu bằng `mindmap`.
2. Gốc là `root(("{title}"))` (không chứa dấu ngoặc kép hay ký tự đặc biệt làm hỏng cú pháp).
3. Sử dụng thụt lề bằng 2 hoặc 4 dấu cách cho các nhánh con.
4. Tên các nhánh không chứa ký tự đặc biệt như (, ), [, ], :, ;, ", ', `, /. Chỉ dùng chữ cái, chữ số và dấu gạch dưới hoặc khoảng trắng an toàn.
"""

    last_err = None
    for model_name in _get_model_candidates():
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return _clean_json_and_mindmap(response.text.strip(), title)
        except Exception as e:
            last_err = e
            continue

    raise last_err or RuntimeError("Không thể kết nối đến mô hình Gemini.")


def generate_study_summary_from_youtube_direct(youtube_url: str, title: str) -> Dict[str, Any]:
    """
    Direct Multimodal YouTube ingestion via Gemini API.
    Bypasses YouTube subtitle rate-limits and supports videos with no subtitles.
    """
    client = get_client()

    prompt = f"""Bạn là một chuyên gia sư phạm và trợ lý học tập AI xuất sắc.
Hãy xem và phân tích sâu toàn bộ nội dung của video YouTube bài giảng này (tiêu đề: {title}) và trích xuất kiến thức cốt lõi.

Hãy trả về kết quả theo ĐÚNG định dạng JSON sau (không thêm bất kỳ giải thích nào ngoài khối JSON):
```json
{{
  "bullet_points": "## 📌 Tóm Tắt Bài Học\\n\\n### 1. Ý tưởng cốt lõi\\n- Nội dung...\\n\\n### 2. Các điểm trọng tâm\\n- Điểm 1...\\n- Điểm 2...",
  "keywords": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3", "Từ khóa 4", "Từ khóa 5"],
  "mindmap_code": "mindmap\\n  root((\\\"{title}\\\"))\\n    Chu_de_1\\n      Y_con_1\\n      Y_con_2\\n    Chu_de_2\\n      Y_con_3"
}}
```

Quy tắc cho `mindmap_code`: Bắt đầu bằng `mindmap`, gốc là `root(("{title}"))`, thụt lề 2 hoặc 4 dấu cách.
"""

    last_err = None
    for model_name in _get_model_candidates():
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part(file_data=types.FileData(file_uri=youtube_url)),
                    prompt
                ]
            )
            return _clean_json_and_mindmap(response.text.strip(), title)
        except Exception as e:
            last_err = e
            continue

    raise last_err or RuntimeError("Không thể phân tích video YouTube qua Gemini.")


def answer_document_query(content_text: str, query: str, history: List[Dict[str, str]] = None) -> str:
    """Answers questions grounded in the document content."""
    client = get_client()

    history_prompt = ""
    if history:
        history_prompt = "\nLịch sử hội thoại trước đó:\n"
        for msg in history[-6:]:
            role = "Người học" if msg["role"] == "user" else "Trợ lý AI"
            history_prompt += f"{role}: {msg['content']}\n"

    prompt = f"""Bạn là Trợ lý gia sư AI học tập thông minh. 
Người học đang đặt câu hỏi dựa trên nội dung bài giảng/tài liệu được cung cấp dưới đây.

Ngữ cảnh bài học/tài liệu:
\"\"\"{content_text[:35000]}\"\"\"
{history_prompt}
Câu hỏi của người học: {query}

Quy tắc trả lời:
1. Dựa chính xác vào thông tin trong ngữ cảnh bài giảng/tài liệu để trả lời.
2. Nếu trong tài liệu không có thông tin, hãy nói rõ: "Tài liệu này không đề cập đến vấn đề này" và có thể giải thích thêm dựa trên kiến thức chung nếu phù hợp.
3. Trình bày rõ ràng, dễ hiểu, có ví dụ minh họa nếu cần, dùng định dạng Markdown.
"""

    last_err = None
    for model_name in _get_model_candidates():
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            last_err = e
            continue

    raise last_err or RuntimeError("Không thể trả lời câu hỏi qua Gemini.")
