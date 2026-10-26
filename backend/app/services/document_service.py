import io
from pypdf import PdfReader
import docx

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text content from PDF file bytes."""
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text_content = []
        for idx, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text_content.append(text.strip())
                
        extracted = "\n\n".join(text_content).strip()
        if not extracted:
            raise ValueError("Không tìm thấy văn bản trong file PDF (có thể là file scan hoặc hình ảnh).")
        return extracted
    except Exception as e:
        raise ValueError(f"Lỗi khi đọc file PDF: {str(e)}")


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text content from Word (.docx) file bytes."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        extracted = "\n\n".join(paragraphs).strip()
        if not extracted:
            raise ValueError("Không tìm thấy nội dung văn bản trong file Word.")
        return extracted
    except Exception as e:
        raise ValueError(f"Lỗi khi đọc file Word: {str(e)}")
