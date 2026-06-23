"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { BrandData } from "../_components/BrandUploader";
import { CardScriptLite, ImagePostScriptLite } from "../_components/ScriptEditor";

export type ProductType = "video" | "imagepost";
export type Aspect = "9:16" | "1:1" | "16:9";
export type PostRatio = "1:1" | "4:5" | "9:16" | "2:1" | "16:9";
export type Duration = "short" | "long";
export type Rate = "slow" | "normal" | "fast";
export type NewsTimeFrame = "24h" | "7d" | "1m" | "3m" | "1y" | "custom";
export type LogoPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

const PREFS_KEY = "ai91_prefs";

export interface Prefs {
  geminiKey: string;
  openaiKey: string;
  type: ProductType;
  aspect: Aspect;
  postRatio: PostRatio;
  count: number;
  useCoverImage: boolean;
  duration: Duration;
  voice: string;
  rate: Rate;
  newsTimeFrame: NewsTimeFrame;
  newsCustomDays: number;
  insertLogo: boolean;
  logoPosition: LogoPosition;
}

export const DEFAULT_PREFS: Prefs = {
  geminiKey: "",
  openaiKey: "",
  type: "video",
  aspect: "9:16",
  postRatio: "4:5",
  count: 5,
  useCoverImage: false,
  duration: "short",
  voice: "en-US-GuyNeural",
  rate: "normal",
  newsTimeFrame: "7d",
  newsCustomDays: 3,
  insertLogo: false,
  logoPosition: "top-right",
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

export interface PostImage {
  url: string;
  headline?: string;
  ratio?: PostRatio;
}

interface VideoGenContextProps {
  prefs: Prefs;
  setPrefs: React.Dispatch<React.SetStateAction<Prefs>>;
  topic: string;
  setTopic: React.Dispatch<React.SetStateAction<string>>;
  topicFocused: boolean;
  setTopicFocused: React.Dispatch<React.SetStateAction<boolean>>;
  apiOption: "gemini" | "ollama" | "openai" | "no_api";
  setApiOption: React.Dispatch<React.SetStateAction<"gemini" | "ollama" | "openai" | "no_api">>;
  ollamaHost: string;
  setOllamaHost: React.Dispatch<React.SetStateAction<string>>;
  ollamaModel: string;
  setOllamaModel: React.Dispatch<React.SetStateAction<string>>;
  tempGeminiKey: string;
  setTempGeminiKey: React.Dispatch<React.SetStateAction<string>>;
  tempOpenaiKey: string;
  setTempOpenaiKey: React.Dispatch<React.SetStateAction<string>>;
  hwStatus: string | null;
  setHwStatus: React.Dispatch<React.SetStateAction<string | null>>;
  hwSafe: boolean | null;
  setHwSafe: React.Dispatch<React.SetStateAction<boolean | null>>;
  hwLoading: boolean;
  setHwLoading: React.Dispatch<React.SetStateAction<boolean>>;
  apiExpanded: boolean;
  setApiExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  brandExpanded: boolean;
  setBrandExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  workspaceTab: "workspace" | "library";
  setWorkspaceTab: React.Dispatch<React.SetStateAction<"workspace" | "library">>;
  newsSourceType: "auto" | "manual" | "none";
  setNewsSourceType: React.Dispatch<React.SetStateAction<"auto" | "manual" | "none">>;
  newsQuery: string;
  setNewsQuery: React.Dispatch<React.SetStateAction<string>>;
  newsQueryFocused: boolean;
  setNewsQueryFocused: React.Dispatch<React.SetStateAction<boolean>>;
  manualUrlsText: string;
  setManualUrlsText: React.Dispatch<React.SetStateAction<string>>;
  manualUrlsFocused: boolean;
  setManualUrlsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  preview: boolean;
  setPreview: React.Dispatch<React.SetStateAction<boolean>>;
  music: boolean;
  setMusic: React.Dispatch<React.SetStateAction<boolean>>;
  musicAvailable: boolean;
  setMusicAvailable: React.Dispatch<React.SetStateAction<boolean>>;
  showAutoConfirm: boolean;
  setShowAutoConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  draftCard: CardScriptLite | null;
  setDraftCard: React.Dispatch<React.SetStateAction<CardScriptLite | null>>;
  draftImage: ImagePostScriptLite | null;
  setDraftImage: React.Dispatch<React.SetStateAction<ImagePostScriptLite | null>>;
  showEditor: boolean;
  setShowEditor: React.Dispatch<React.SetStateAction<boolean>>;
  showLayoutStudio: boolean;
  setShowLayoutStudio: React.Dispatch<React.SetStateAction<boolean>>;
  libRefresh: number;
  setLibRefresh: React.Dispatch<React.SetStateAction<number>>;
  running: boolean;
  setRunning: React.Dispatch<React.SetStateAction<boolean>>;
  brand: BrandData | null;
  setBrand: React.Dispatch<React.SetStateAction<BrandData | null>>;
  abortRef: React.MutableRefObject<AbortController | null>;
  status: string;
  setStatus: React.Dispatch<React.SetStateAction<string>>;
  log: string[];
  setLog: React.Dispatch<React.SetStateAction<string[]>>;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  thumbs: string[];
  setThumbs: React.Dispatch<React.SetStateAction<string[]>>;
  videoUrl: string;
  setVideoUrl: React.Dispatch<React.SetStateAction<string>>;
  images: PostImage[];
  setImages: React.Dispatch<React.SetStateAction<PostImage[]>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  countdown: number;
  setCountdown: React.Dispatch<React.SetStateAction<number>>;
  
  // Computed values
  needsKey: boolean;
  step2Locked: boolean;
  step3Locked: boolean;
  step4Locked: boolean;
  step2Incomplete: boolean;
  step5Locked: boolean;
  canRun: boolean;
  isVideo: boolean;
  
  // Helper methods
  pushLog: (msg: string) => void;
  updatePrefs: (newPrefs: Partial<Prefs>) => void;
}

const VideoGenContext = createContext<VideoGenContextProps | undefined>(undefined);

export function VideoGenProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [topic, setTopic] = useState("");
  const [topicFocused, setTopicFocused] = useState(false);
  const [apiOption, setApiOption] = useState<"gemini" | "ollama" | "openai" | "no_api">("gemini");
  const [ollamaHost, setOllamaHost] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b");
  const [tempGeminiKey, setTempGeminiKey] = useState("");
  const [tempOpenaiKey, setTempOpenaiKey] = useState("");
  const [hwStatus, setHwStatus] = useState<string | null>(null);
  const [hwSafe, setHwSafe] = useState<boolean | null>(null);
  const [hwLoading, setHwLoading] = useState(false);
  const [apiExpanded, setApiExpanded] = useState(false);
  const [brandExpanded, setBrandExpanded] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<"workspace" | "library">("workspace");
  
  const [newsSourceType, setNewsSourceType] = useState<"auto" | "manual" | "none">("auto");
  const [newsQuery, setNewsQuery] = useState("");
  const [newsQueryFocused, setNewsQueryFocused] = useState(false);
  const [manualUrlsText, setManualUrlsText] = useState<string>("");
  const [manualUrlsFocused, setManualUrlsFocused] = useState(false);
  
  const [preview, setPreview] = useState(true);
  const [music, setMusic] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(false);
  const [showAutoConfirm, setShowAutoConfirm] = useState(false);

  const [draftCard, setDraftCard] = useState<CardScriptLite | null>(null);
  const [draftImage, setDraftImage] = useState<ImagePostScriptLite | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showLayoutStudio, setShowLayoutStudio] = useState(false);
  const [libRefresh, setLibRefresh] = useState(0);

  const [running, setRunning] = useState(false);
  const [brand, setBrand] = useState<BrandData | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [images, setImages] = useState<PostImage[]>([]);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPrefs(loadPrefs());
      const storedOllamaHost = localStorage.getItem("OLLAMA_HOST");
      if (storedOllamaHost) setOllamaHost(storedOllamaHost);
      const storedOllamaModel = localStorage.getItem("OLLAMA_MODEL");
      if (storedOllamaModel) setOllamaModel(storedOllamaModel);
      const storedApiOption = localStorage.getItem("API_OPTION") as any;
      if (storedApiOption) setApiOption(storedApiOption);
      const storedNewsSourceType = localStorage.getItem("NEWS_SOURCE_TYPE") as any;
      if (storedNewsSourceType) setNewsSourceType(storedNewsSourceType);
      const storedNewsQuery = localStorage.getItem("NEWS_QUERY");
      if (storedNewsQuery) setNewsQuery(storedNewsQuery);
    }
  }, []);

  const pushLog = (msg: string) => {
    setLog((l) => [...l, msg]);
    setStatus(msg);
  };

  const updatePrefs = (newPrefs: Partial<Prefs>) => {
    setPrefs((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const needsKey = (apiOption === "gemini" && !prefs.geminiKey) || (apiOption === "openai" && !prefs.openaiKey);
  const step2Locked = needsKey;
  const step3Locked = needsKey;
  const step4Locked = needsKey;
  const step2Incomplete = (newsSourceType === "auto" && newsQuery.trim().length === 0) || 
                          (newsSourceType === "none" && topic.trim().length === 0) || 
                          (newsSourceType === "manual" && manualUrlsText.trim().length === 0);
  const step5Locked = needsKey || step2Incomplete || !brand;
  const canRun = !running && !step5Locked;
  const isVideo = prefs.type === "video";

  return (
    <VideoGenContext.Provider
      value={{
        prefs, setPrefs, topic, setTopic, topicFocused, setTopicFocused,
        apiOption, setApiOption, ollamaHost, setOllamaHost, ollamaModel, setOllamaModel,
        tempGeminiKey, setTempGeminiKey, tempOpenaiKey, setTempOpenaiKey,
        hwStatus, setHwStatus, hwSafe, setHwSafe, hwLoading, setHwLoading,
        apiExpanded, setApiExpanded, brandExpanded, setBrandExpanded,
        workspaceTab, setWorkspaceTab, newsSourceType, setNewsSourceType,
        newsQuery, setNewsQuery, newsQueryFocused, setNewsQueryFocused,
        manualUrlsText, setManualUrlsText, manualUrlsFocused, setManualUrlsFocused,
        preview, setPreview, music, setMusic, musicAvailable, setMusicAvailable,
        showAutoConfirm, setShowAutoConfirm, draftCard, setDraftCard,
        draftImage, setDraftImage, showEditor, setShowEditor, showLayoutStudio, setShowLayoutStudio,
        libRefresh, setLibRefresh, running, setRunning, brand, setBrand,
        abortRef, status, setStatus, log, setLog, title, setTitle, thumbs, setThumbs,
        videoUrl, setVideoUrl, images, setImages, error, setError, countdown, setCountdown,
        needsKey, step2Locked, step3Locked, step4Locked, step2Incomplete, step5Locked, canRun, isVideo,
        pushLog, updatePrefs
      }}
    >
      {children}
    </VideoGenContext.Provider>
  );
}

export function useVideoGen() {
  const context = useContext(VideoGenContext);
  if (context === undefined) {
    throw new Error("useVideoGen must be used within a VideoGenProvider");
  }
  return context;
}
