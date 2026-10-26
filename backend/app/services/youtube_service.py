import re
import json
import urllib.parse
import httpx
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

def extract_video_id(url: str) -> str:
    """
    Extracts video ID from various YouTube URL formats:
    - https://www.youtube.com/watch?v=dQw4w9WgXcQ
    - https://youtu.be/dQw4w9WgXcQ
    - https://www.youtube.com/embed/dQw4w9WgXcQ
    - https://www.youtube.com/v/dQw4w9WgXcQ
    """
    url = url.strip()
    parsed = urllib.parse.urlparse(url)
    
    if parsed.hostname in ("youtu.be", "www.youtu.be"):
        return parsed.path.lstrip("/").split("&")[0].split("?")[0]
        
    if parsed.hostname in ("youtube.com", "www.youtube.com", "m.youtube.com"):
        if parsed.path == "/watch":
            query = urllib.parse.parse_qs(parsed.query)
            if "v" in query:
                return query["v"][0]
        elif parsed.path.startswith(("/embed/", "/v/")):
            return parsed.path.split("/")[2]
            
    # Fallback regex
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    if match:
        return match.group(1)
        
    raise ValueError("Định dạng liên kết YouTube không hợp lệ.")


async def get_video_title(video_id: str) -> str:
    """Fetch video title via YouTube oEmbed API without requiring an API key"""
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("title", f"YouTube Video ({video_id})")
    except Exception:
        pass
    return f"YouTube Video ({video_id})"


def _parse_transcript_data(ydl, target_formats) -> str:
    """Parses transcript from json3 or vtt format using ydl's authenticated session."""
    # 1. Try json3 format
    json3_fmt = next((f for f in target_formats if f.get('ext') == 'json3'), None)
    if json3_fmt:
        try:
            content = ydl.urlopen(json3_fmt['url']).read().decode('utf-8')
            data = json.loads(content)
            lines = []
            for ev in data.get('events', []):
                for seg in ev.get('segs', []):
                    if seg.get('utf8'):
                        lines.append(seg['utf8'])
            text = ' '.join(lines).strip()
            if text:
                return text
        except Exception:
            pass

    # 2. Try vtt format
    vtt_fmt = next((f for f in target_formats if f.get('ext') == 'vtt'), None)
    if vtt_fmt:
        try:
            content = ydl.urlopen(vtt_fmt['url']).read().decode('utf-8')
            clean_lines = []
            for line in content.splitlines():
                line = line.strip()
                if not line or '-->' in line or line.startswith(('WEBVTT', 'Kind:', 'Language:')):
                    continue
                clean = re.sub(r'<[^>]+>', '', line).strip()
                if clean and (not clean_lines or clean != clean_lines[-1]):
                    clean_lines.append(clean)
            text = ' '.join(clean_lines).strip()
            if text:
                return text
        except Exception:
            pass

    return ''


def get_youtube_transcript(video_id: str) -> str:
    """
    Extracts transcript from YouTube video.
    Primary Engine: yt-dlp (bypasses YouTube anti-bot XML 0-byte block)
    Secondary Engine: youtube-transcript-api (fallback)
    """
    video_url = f"https://www.youtube.com/watch?v={video_id}"

    # Method 1: Using yt-dlp with session management
    try:
        ydl_opts = {
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            subs = info.get('subtitles') or {}
            auto_subs = info.get('automatic_captions') or {}

            # Priority: Vietnamese manual -> Vietnamese auto -> English manual -> English auto -> Any available
            target_formats = (
                subs.get('vi') or auto_subs.get('vi') or
                subs.get('en') or auto_subs.get('en')
            )
            if not target_formats:
                all_subs = {**subs, **auto_subs}
                if all_subs:
                    target_formats = next(iter(all_subs.values()))

            if target_formats:
                extracted_text = _parse_transcript_data(ydl, target_formats)
                if extracted_text:
                    return extracted_text
    except Exception as ytdlp_err:
        # If yt-dlp encounters an error, proceed to fallback
        pass

    # Method 2: Fallback to YouTubeTranscriptApi
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        try:
            transcript = transcript_list.find_transcript(['vi', 'en', 'auto'])
        except Exception:
            transcript = next(iter(transcript_list))
        data = transcript.fetch()
        full_text = " ".join([item['text'].strip() for item in data if item.get('text')])
        if full_text.strip():
            return full_text.strip()
    except Exception:
        pass

    raise ValueError(
        "Không thể lấy phụ đề cho video này (YouTube không có sẵn phụ đề tiếng Việt/tiếng Anh hoặc video bị chặn trích xuất). "
        "💡 Gợi ý: Hãy thử một video bài giảng có phụ đề (CC bật được trên YouTube) hoặc tải file tài liệu PDF/Word ở tab bên cạnh."
    )
