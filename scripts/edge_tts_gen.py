"""
Sinh giọng đọc tiếng Việt MIỄN PHÍ bằng Edge-TTS (Microsoft Edge online voices, không cần API key).

Cài: pip install edge-tts

Dùng (được voice.ts gọi tự động):
  python edge_tts_gen.py --text "..." --voice vi-VN-HoaiMyNeural --out-audio a.mp3 --out-json a.json

Xuất:
  - file mp3 (giọng đọc)
  - file json: { "voice", "text", "words": [ { "word", "start", "end" } ] }
    start/end tính bằng GIÂY (dùng cho hiệu ứng phụ đề trong Remotion).
"""
import argparse
import asyncio
import json
import re

import edge_tts


def sanitize(text: str) -> str:
    """Làm sạch text để tránh lỗi NoAudioReceived của Edge-TTS."""
    text = text.replace("\r", " ").replace("\n", " ")
    # dấu gạch ngang đứng một mình " - " dễ tạo đoạn rỗng -> đổi thành dấu phẩy
    text = re.sub(r"\s+-\s+", ", ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


async def synthesize(text: str, args) -> list:
    communicate = edge_tts.Communicate(
        text,
        args.voice,
        rate=args.rate,
        volume=args.volume,
        pitch=args.pitch,
        boundary="WordBoundary",  # lấy timestamp theo TỪNG TỪ (cho hiệu ứng phụ đề)
    )
    words = []
    audio = bytearray()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            # offset/duration tính bằng đơn vị 100 nanosecond -> đổi ra giây
            start = chunk["offset"] / 10_000_000
            end = (chunk["offset"] + chunk["duration"]) / 10_000_000
            words.append({"word": chunk["text"], "start": start, "end": end})
    if not audio:
        raise edge_tts.exceptions.NoAudioReceived("empty audio")
    with open(args.out_audio, "wb") as audio_file:
        audio_file.write(bytes(audio))
    return words


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", required=True)
    parser.add_argument("--voice", default="vi-VN-HoaiMyNeural")
    parser.add_argument("--out-audio", required=True)
    parser.add_argument("--out-json", required=True)
    parser.add_argument("--rate", default="+0%")
    parser.add_argument("--volume", default="+0%")
    parser.add_argument("--pitch", default="+0Hz")
    args = parser.parse_args()

    text = sanitize(args.text)

    # Edge-TTS thỉnh thoảng trả rỗng (NoAudioReceived) -> thử lại vài lần
    words = None
    last_err = None
    for attempt in range(5):
        try:
            words = await synthesize(text, args)
            break
        except Exception as err:  # noqa: BLE001
            last_err = err
            await asyncio.sleep(1.5 * (attempt + 1))
    if words is None:
        raise SystemExit(f"Edge-TTS thất bại sau 5 lần thử: {last_err}")

    with open(args.out_json, "w", encoding="utf-8") as json_file:
        json.dump(
            {"voice": args.voice, "text": text, "words": words},
            json_file,
            ensure_ascii=False,
            indent=2,
        )


if __name__ == "__main__":
    asyncio.run(main())
