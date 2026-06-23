"use client";

import { useVideoGen } from "../_context/VideoGenContext";
import { CardScriptLite, ImagePostScriptLite } from "../_components/ScriptEditor";
import { PostImage } from "../_context/VideoGenContext";

export function usePipeline() {
  const context = useVideoGen();
  const {
    newsSourceType,
    newsQuery,
    topic,
    manualUrlsText,
    apiOption,
    ollamaHost,
    ollamaModel,
    prefs,
    music,
    musicAvailable,
    brand,
    preview,
    setRunning,
    setError,
    setDraftCard,
    setDraftImage,
    setShowEditor,
    setThumbs,
    setImages,
    setStatus,
    setLog,
    abortRef,
    pushLog,
    draftImage,
    setVideoUrl,
    setTitle,
    setShowLayoutStudio,
    setLibRefresh,
    setHwLoading,
    setHwSafe,
    setHwStatus,
  } = context;

  const baseBody = () => ({
    topic: newsSourceType === "auto" ? (newsQuery.trim() || "Bản tin tự động") : newsSourceType === "none" ? (topic.trim() || "Tóm tắt kịch bản") : "Điểm tin từ nguồn cung cấp",
    useNews: newsSourceType !== "none",
    noApiMode: false,
    ollamaMode: apiOption === "ollama",
    ollamaHost: apiOption === "ollama" ? ollamaHost : undefined,
    ollamaModel: apiOption === "ollama" ? ollamaModel : undefined,
    newsSourceType: newsSourceType,
    newsQuery: newsQuery.trim(),
    newsTimeframe: prefs.newsTimeFrame === "custom" ? `${prefs.newsCustomDays}d` : prefs.newsTimeFrame,
    newsManualUrls: manualUrlsText.split("\n").map(u => u.trim()).filter(Boolean),
    geminiKey: apiOption === "gemini" ? prefs.geminiKey : undefined,
    openaiKey: apiOption === "openai" ? prefs.openaiKey : undefined,
    type: prefs.type,
    aspectRatio: prefs.aspect,
    postRatio: prefs.postRatio,
    count: prefs.count,
    useCoverImage: prefs.useCoverImage,
    duration: prefs.duration,
    voice: prefs.voice,
    rate: prefs.rate,
    music: music && musicAvailable,
    brand: brand ?? undefined,
  });

  async function checkHardware() {
    setHwLoading(true);
    try {
      const res = await fetch("/api/hardware");
      const data = await res.json();
      setHwSafe(data.isSafe);
      setHwStatus(
        `CPU: ${data.cpuDetail} (${data.cores} nhân, ${data.threads} luồng)\n` +
        `RAM: ${data.ramDetail}\n` +
        `GPU: ${data.gpuModel !== "Không xác định" ? data.gpuModel : "Onboard/Không rõ"}\n\n` +
        `${data.message}`
      );
    } catch {
      setHwStatus("Lỗi khi kiểm tra phần cứng.");
      setHwSafe(false);
    } finally {
      setHwLoading(false);
    }
  }

  async function genScript() {
    setRunning(true);
    setError("");
    setDraftCard(null);
    setDraftImage(null);
    setShowEditor(false);
    setThumbs([]);
    setImages([]);
    setStatus("Đang soạn nội dung để xem trước...");
    setLog(["Đang soạn nội dung để xem trước..."]);

    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseBody()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
      if (data.cardScript) setDraftCard(data.cardScript);
      if (data.imagePostScript) setDraftImage(data.imagePostScript);
      setShowEditor(true);
      setLog((l) => [
        ...l,
        prefs.type === "imagepost"
          ? "Nội dung sẵn sàng — duyệt/sửa rồi bấm 🖼️ Lấy ảnh."
          : "Kịch bản sẵn sàng — xem/sửa rồi bấm Render.",
      ]);
      setStatus("Nội dung sẵn sàng.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function fetchImages() {
    if (!draftImage) return;
    setRunning(true);
    setError("");
    setThumbs([]);
    setStatus("Đang lấy ảnh cho từng slide...");
    setLog((l) => [...l, "Đang lấy ảnh cho từng slide..."]);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseBody(), action: "imageFetch", imagePostScript: draftImage }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        let msg = `Lỗi máy chủ (${res.status})`;
        try { msg = JSON.parse(t).error ?? msg; } catch { if (t) msg += `: ${t}`; }
        throw new Error(msg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.type === "status") pushLog(e.message);
          else if (e.type === "image") {
            setDraftImage((prev) =>
              prev
                ? { ...prev, slides: prev.slides.map((sl, idx) => (idx === e.index - 1 ? { ...sl, imageSrc: e.url || sl.imageSrc } : sl)) }
                : prev,
            );
            if (e.url) setThumbs((t) => [...t, e.url]);
          } else if (e.type === "imagescript") {
            setDraftImage(e.script);
            pushLog("✅ Đã có ảnh cho cả bộ — xem lại rồi bấm Tạo bộ ảnh.");
          } else if (e.type === "error") {
            setError(e.message);
          }
        }
      }
      setStatus("Đã lấy ảnh xong.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") pushLog("🛑 Đã hủy lấy ảnh.");
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  async function fetchSingleImage(index: number) {
    if (!draftImage || !draftImage.slides[index]) return;
    setRunning(true);
    setError("");
    setStatus(`Đang lấy lại ảnh ${index}...`);
    pushLog(`Đang lấy lại ảnh thẻ ${index}...`);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const slide = draftImage.slides[index];
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseBody(), action: "imageFetchSingle", slide, index }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        let msg = `Lỗi máy chủ (${res.status})`;
        try { msg = JSON.parse(t).error ?? msg; } catch { if (t) msg += `: ${t}`; }
        throw new Error(msg);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.type === "status") pushLog(e.message);
          else if (e.type === "image") {
            setDraftImage((prev) =>
              prev
                ? { ...prev, slides: prev.slides.map((sl, idx) => (idx === index ? { ...sl, imageSrc: e.url || sl.imageSrc } : sl)) }
                : prev,
            );
            if (e.url) setThumbs((t) => [...t, e.url]);
          } else if (e.type === "error") {
            setError(e.message);
          }
        }
      }
      setStatus("Đã cập nhật ảnh.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") pushLog("🛑 Đã hủy lấy ảnh.");
      else setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  async function generate(extra?: { cardScript?: CardScriptLite; imagePostScript?: ImagePostScriptLite; preset?: string }) {
    setRunning(true);
    setError("");
    setVideoUrl("");
    setImages([]);
    setThumbs([]);
    setTitle("");
    setShowLayoutStudio(false);
    setLog([]);
    setStatus("Bắt đầu...");

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseBody(), ...extra }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        let msg = `Lỗi máy chủ (${res.status})`;
        try {
          msg = JSON.parse(t).error ?? msg;
        } catch {
          if (t) msg += `: ${t}`;
        }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.type === "status") pushLog(e.message);
          else if (e.type === "storyboard") {
            setTitle(e.storyboard.title);
            pushLog(`Kịch bản: "${e.storyboard.title}"`);
          } else if (e.type === "scene") {
            if (e.imageUrl) setThumbs((t) => [...t, e.imageUrl]);
          } else if (e.type === "image") {
            if (e.url) setImages((im) => [...im, { url: e.url, headline: e.headline, ratio: e.ratio }]);
          } else if (e.type === "done") {
            if (e.videoUrl) setVideoUrl(e.videoUrl);
            if (e.images) setImages(e.images.map((im: PostImage) => ({ url: im.url, headline: im.headline, ratio: im.ratio })));
            setShowEditor(false);
            setLibRefresh((n) => n + 1);
            pushLog("✅ Hoàn thành!");
          } else if (e.type === "error") {
            setError(e.message);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        pushLog("🛑 Đã hủy job.");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function cancel() {
    abortRef.current?.abort();
  }

  async function onPrimary() {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
    if (preview) await genScript();
    else await generate();
  }

  return {
    checkHardware,
    genScript,
    fetchImages,
    fetchSingleImage,
    generate,
    cancel,
    onPrimary,
  };
}
