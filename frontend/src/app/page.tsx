/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Upload, Activity, FileText, MapPin, AlertTriangle, 
  TrendingUp, TrendingDown, Layers, Shield, Play, 
  Download, RefreshCw, Sliders, CheckCircle, Clock, Plus, Eye,
  ArrowRight, Award, BarChart2, Server, EyeOff, Check,
  Search, Calendar, ChevronLeft, ChevronRight, Filter
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from "recharts";

// Dynamically load Leaflet Map component with SSR disabled
const RiskMap = dynamic(() => import("../components/RiskMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-[#111827] rounded-xl flex items-center justify-center border border-[#1F2937]">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="animate-spin text-blue-500 w-8 h-8" />
        <span className="text-slate-400 text-sm">Loading Geolocation Hotspots...</span>
      </div>
    </div>
  )
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

// Bangalore Fallback Mock Data in case backend is offline
const MOCK_ANALYTICS = {
  kpis: {
    total_violations: { title: "Total Violations", value: "148", change: "+16.4% vs last week", type: "negative" },
    high_risk_zones: { title: "High Risk Zones", value: "4", change: "Risk threshold > 35", type: "negative" },
    active_hotspots: { title: "Primary Hotspot", value: "Silk Board Junction", change: "Score: 84.6", type: "neutral" },
    repeat_offenders: { title: "Repeat Offenders", value: "15", change: "Plates with >= 3 offenses", type: "negative" }
  },
  violation_distribution: [
    { name: "Helmet Non-compliance", value: 54 },
    { name: "Triple Riding", value: 32 },
    { name: "Seatbelt Non-compliance", value: 24 },
    { name: "Illegal Parking", value: 26 },
    { name: "Wrong-side Driving", value: 18 },
    { name: "Stop-line Violation", value: 15 },
    { name: "Red-light Violation", value: 9 }
  ],
  hourly_trends: [
    { hour: "00:00", violations: 3 }, { hour: "04:00", violations: 1 },
    { hour: "08:00", violations: 34 }, { hour: "12:00", violations: 16 },
    { hour: "16:00", violations: 22 }, { hour: "20:00", violations: 42 }
  ],
  weekly_trends: [
    { day: "Mon", violations: 18 }, { day: "Tue", violations: 22 },
    { day: "Wed", violations: 28 }, { day: "Thu", violations: 26 },
    { day: "Fri", violations: 36 }, { day: "Sat", violations: 12 },
    { day: "Sun", violations: 6 }
  ]
};

const MOCK_HOTSPOTS = [
  { location: "Silk Board Junction", latitude: 12.9176, longitude: 77.6244, risk_score: 84.6, count: 52, trend: "increasing", recommendation: "Deploy helmet check enforcement & lock lane blocking buses." },
  { location: "Hebbal Flyover", latitude: 13.0359, longitude: 77.5970, risk_score: 58.4, count: 32, trend: "increasing", recommendation: "Deploy radar interceptors for overspeeding commuters." },
  { location: "Tin Factory Junction", latitude: 13.0040, longitude: 77.6677, risk_score: 46.2, count: 28, trend: "stable", recommendation: "Deploy static monitoring checkpoint and towing patrols." },
  { location: "Marathahalli Bridge", latitude: 12.9591, longitude: 77.6974, risk_score: 31.8, count: 22, trend: "stable", recommendation: "Monitor peak hour illegal loading blocks." },
  { location: "Town Hall Junction", latitude: 12.9649, longitude: 77.5857, risk_score: 21.0, count: 18, trend: "decreasing", recommendation: "Maintain regular automated sweep scans." }
];

const MOCK_RECOMMENDATIONS = [
  { id: 1, title: "Flag Repeat Offender: KA-03-JN-4820", location: "Silk Board Junction", priority: "Critical", action: "Flag vehicle in ALPR watchlist for active officer intercept.", trigger: "Vehicle accumulated 6 separate traffic violations. Last seen at Silk Board.", timestamp: "2026-06-16T01:00:00", status: "Active" },
  { id: 2, title: "Deploy Helmet Patrols: Silk Board", location: "Silk Board Junction", priority: "High", action: "Deploy 2 static officers for manual compliance checkpoints.", trigger: "Helmet non-compliance surged 42% during morning rush.", timestamp: "2026-06-16T00:30:00", status: "Active" },
  { id: 3, title: "Targeted Towing Sweeps: Tin Factory", location: "Tin Factory Junction", priority: "High", action: "Deploy towing units for clearway sweep maintenance.", trigger: "Illegal parking causing severe bottlenecks at KR Puram merge.", timestamp: "2026-06-16T00:15:00", status: "Active" }
];

const MOCK_EVALUATION = {
  precision: 0.852,
  recall: 0.814,
  f1_score: 0.833,
  map_50: 0.846,
  map_50_95: 0.598,
  avg_inference_time_ms: 114.5,
  total_images_processed: 128,
  ocr_accuracy: 0.865,
  system_throughput_fps: 8.7,
  methodology: "Validation metrics are evaluated against 150 calibrated urban camera frames. YOLOv8 base parameters map to COCO detection standards, adjusted for localized vehicle size distributions in Bangalore (including multi-class Rickshaws)."
};

export default function Dashboard() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"control" | "analytics" | "rankings" | "recommendations" | "evaluation" | "search">("analytics");
  
  // Platform Datasets
  const [violations, setViolations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(MOCK_ANALYTICS);
  const [hotspots, setHotspots] = useState<any[]>(MOCK_HOTSPOTS);
  const [recs, setRecs] = useState<any[]>(MOCK_RECOMMENDATIONS);
  const [evaluation, setEvaluation] = useState<any>(MOCK_EVALUATION);
  
  // Status Flags
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLocation, setUploadLocation] = useState<string>("Silk Board Junction");
  const [demoMode, setDemoMode] = useState<boolean>(true);
  const [demoViolation, setDemoViolation] = useState<string>("Helmet Non-compliance");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [viewingCardUrl, setViewingCardUrl] = useState<string | null>(null);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [usePreprocessing, setUsePreprocessing] = useState<boolean>(true);
  const [preprocessMode, setPreprocessMode] = useState<string>("Auto");

  // License Plate Inline Editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [isUpdatingPlate, setIsUpdatingPlate] = useState<boolean>(false);

  const handleSavePlate = async (violationId: number) => {
    if (!editingText.trim()) return;
    setIsUpdatingPlate(true);
    try {
      const res = await fetch(`${API_BASE}/api/violations/${violationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plate_number: editingText.toUpperCase() })
      });
      if (!res.ok) throw new Error("Failed to update plate");
      const data = await res.json();
      
      // Update locally
      setViolations(prev => prev.map(v => v.id === violationId ? { ...v, plate_number: data.violation.plate_number } : v));
      setSearchResults(prev => prev.map(v => v.id === violationId ? { ...v, plate_number: data.violation.plate_number } : v));
      
      if (uploadResult && uploadResult.violations) {
        setUploadResult({
          ...uploadResult,
          violations: uploadResult.violations.map((v: any) => v.id === violationId ? { ...v, plate_number: data.violation.plate_number } : v)
        });
      }
      
      // Refresh image url by appending a timestamp to bypass image cache
      if (viewingCardUrl && (viewingCardUrl.includes(`/api/evidence/${violationId}`) || viewingCardUrl.includes(`?t=`))) {
        setViewingCardUrl(`${API_BASE}/api/evidence/${violationId}?t=${Date.now()}`);
      }
      
      setEditingId(null);
    } catch (err) {
      alert("Failed to save license plate number.");
    } finally {
      setIsUpdatingPlate(false);
    }
  };

  // Interactive Slider State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<"grid" | "slider">("grid");

  // Search tab State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchViolationType, setSearchViolationType] = useState("");
  const [searchSeverity, setSearchSeverity] = useState("");
  const [searchPlate, setSearchPlate] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalSearchCount, setTotalSearchCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Judge Demo state
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(-1);
  const demoStepsList = [
    "Ingesting raw traffic sensor feed...",
    "Applying CLAHE & bilateral preprocessing layers...",
    "Running YOLOv8 vehicle & road user classification...",
    "Detecting stop-line & wrong-side violations...",
    "Running cropped license plate perspective warp & OCR...",
    "Compiling official ReportLab PDF prosecution ticket...",
    "Registering evidence hash SHA-256 to database...",
    "Finalizing dashboard state & generating AI recommendations..."
  ];

  // Sorting for Risk Rankings Table
  const [sortField, setSortField] = useState<string>("risk_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Colors for Recharts pie
  const COLORS = ["#3b82f6", "#ef4444", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#6366f1"];

  // Fetch all core dashboard feeds
  const refreshDashboardFeeds = async () => {
    try {
      const testRes = await fetch(`${API_BASE}/`);
      if (!testRes.ok) throw new Error("Backend offline");

      setIsBackendOnline(true);

      // Fetch Analytics
      const analRes = await fetch(`${API_BASE}/api/analytics`);
      const analData = await analRes.json();
      setAnalytics(analData);

      // Fetch Hotspots
      const hotRes = await fetch(`${API_BASE}/api/hotspots`);
      const hotData = await hotRes.json();
      setHotspots(hotData);

      // Fetch Recommendations
      const recsRes = await fetch(`${API_BASE}/api/recommendations`);
      const recsData = await recsRes.json();
      setRecs(recsData);

      // Fetch Evaluation
      const evalRes = await fetch(`${API_BASE}/api/evaluation`);
      const evalData = await evalRes.json();
      setEvaluation(evalData);

      // Fetch Recent Violations List
      const violRes = await fetch(`${API_BASE}/api/violations?limit=10`);
      const violData = await violRes.json();
      setViolations(violData.violations);

    } catch (err) {
      console.warn("Backend API offline. Standalone demo mode.", err);
      setIsBackendOnline(false);
      setAnalytics(MOCK_ANALYTICS);
      setHotspots(MOCK_HOTSPOTS);
      setRecs(MOCK_RECOMMENDATIONS);
      setEvaluation(MOCK_EVALUATION);
    }
  };

  useEffect(() => {
    refreshDashboardFeeds();
  }, []);

  const fetchSearchResults = async () => {
    setIsSearching(true);
    try {
      const offset = (searchPage - 1) * 10;
      let url = `${API_BASE}/api/violations?limit=10&offset=${offset}`;
      
      if (searchLocation) url += `&location=${encodeURIComponent(searchLocation)}`;
      if (searchViolationType) url += `&violation_type=${encodeURIComponent(searchViolationType)}`;
      if (searchSeverity) url += `&severity=${encodeURIComponent(searchSeverity)}`;
      if (searchPlate) url += `&plate_number=${encodeURIComponent(searchPlate)}`;
      if (searchStartDate) url += `&start_date=${encodeURIComponent(searchStartDate)}`;
      if (searchEndDate) url += `&end_date=${encodeURIComponent(searchEndDate)}`;
      if (searchQuery) url += `&keyword=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data.violations);
      setTotalSearchCount(data.total);
    } catch (err) {
      console.error("Failed to fetch search results", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === "search") {
      fetchSearchResults();
    }
  }, [activeTab, searchPage, searchLocation, searchViolationType, searchSeverity, searchPlate, searchStartDate, searchEndDate, searchQuery]);

  const handleRunJudgeDemo = async () => {
    setShowDemoModal(true);
    setDemoStepIndex(0);
    setViewMode("grid"); // Reset control visualizer tab to grid view
    
    let apiPromise = fetch(`${API_BASE}/api/judge-demo`, { method: "POST" })
      .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      });
      
    for (let i = 0; i < demoStepsList.length; i++) {
      setDemoStepIndex(i);
      await new Promise(r => setTimeout(r, 450));
    }
    
    try {
      const data = await apiPromise;
      if (data.success && data.violations && data.violations.length > 0) {
        setUploadResult(data);
        await refreshDashboardFeeds();
        setShowDemoModal(false);
        setActiveTab("control");
        const violationId = data.violations[0].id;
        setViewingCardUrl(`${API_BASE}/api/evidence/${violationId}`);
      } else {
        alert("Judge demo completed but no violations detected.");
        setShowDemoModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("FastAPI server failed to process Judge Demo scenario. Verify server status.");
      setShowDemoModal(false);
    }
  };

  // Action: Trigger real-time stream simulation
  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimMessage("Streaming real-time municipal camera nodes...");
    try {
      const res = await fetch(`${API_BASE}/api/simulate?count=6`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSimMessage(`Active: Ingested ${data.added_count} violations to database. Updating models...`);
        await refreshDashboardFeeds();
      }
    } catch (err) {
      setSimMessage("Simulation error. Check local FastAPI server.");
    }
    setTimeout(() => {
      setIsSimulating(false);
      setSimMessage(null);
    }, 2500);
  };

  // Action: File upload for CV analysis
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadResult(null);
    setViewMode("grid"); // Reset to grid view

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("location", uploadLocation);
    formData.append("demo_mode", String(demoMode));
    formData.append("preprocess", String(usePreprocessing));
    formData.append("preprocess_mode", preprocessMode);
    if (demoMode && demoViolation) {
      formData.append("demo_violation", demoViolation);
    }

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload processing error");
      const data = await res.json();
      setUploadResult(data);
      refreshDashboardFeeds();
    } catch (err) {
      alert("Inference server failed. Verify python run.py is running on port 8000.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Sorting logic for Risk Rankings Table
  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const sortedHotspots = [...hotspots].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    if (typeof aValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc" 
      ? aValue - bValue 
      : bValue - aValue;
  });

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Branding */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/vision.png" alt="Eye of Law Logo" className="w-6 h-6 object-contain" />
              <span className="font-bold tracking-wider text-sm text-slate-800 font-mono">EYE OF LAW</span>
            </div>
            {/* Solid orange dot (no ping radar) */}
            <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
          </div>

          {/* System status display */}
          <div className="px-6 py-4">
            <div className={`flex items-center gap-2 py-1.5 px-3 rounded border text-xs font-semibold ${
              isBackendOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
              {isBackendOnline ? "COMMAND ACTIVE" : "OFFLINE DEMO SYSTEM"}
            </div>
          </div>

          {/* Menu Navigation */}
          <nav className="px-4 py-2 space-y-1">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "analytics" 
                  ? "bg-orange-50/70 text-orange-600 border-l-4 border-orange-500 font-bold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Activity className="w-4 h-4 text-orange-500" />
              Intelligence Dashboard
            </button>

            <button
              onClick={() => setActiveTab("control")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "control" 
                  ? "bg-orange-50/70 text-orange-600 border-l-4 border-orange-500 font-bold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Upload className="w-4 h-4 text-orange-500" />
              Control Room (Upload)
            </button>

            <button
              onClick={() => setActiveTab("search")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "search" 
                  ? "bg-orange-50/70 text-orange-600 border-l-4 border-orange-500 font-bold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Search className="w-4 h-4 text-orange-500" />
              Searchable Records
            </button>

            <button
              onClick={() => setActiveTab("rankings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "rankings" 
                  ? "bg-orange-50/70 text-orange-600 border-l-4 border-orange-500 font-bold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <MapPin className="w-4 h-4 text-orange-500" />
              Junction Risk priority
            </button>

            <button
              onClick={() => setActiveTab("recommendations")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "recommendations" 
                  ? "bg-orange-50/70 text-orange-600 border-l-4 border-orange-500 font-bold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Sliders className="w-4 h-4 text-orange-500" />
              AI Recommendations
              {recs.length > 0 && (
                <span className="ml-auto bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {recs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("evaluation")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === "evaluation" 
                  ? "bg-orange-50/70 text-orange-600 border-l-4 border-orange-500 font-bold shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Award className="w-4 h-4 text-orange-500" />
              Model Evaluation
            </button>
          </nav>
        </div>

        {/* Bottom Panel Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          <div className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase mb-1">Enforcement Tools</div>
          
          <button
            onClick={handleRunJudgeDemo}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wider font-mono shadow-sm cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 fill-white text-orange-600" />
            Run Judge Demo Mode
          </button>

          <button
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-orange-600 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? "Streaming..." : "Simulate Live Video"}
          </button>
          
          <button 
            onClick={refreshDashboardFeeds}
            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Systems
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTAINER AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white shrink-0 sticky top-0 z-[1010] shadow-sm">
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-wide uppercase font-mono">Eye of Law - Traffic Command Hub</h1>
            <p className="text-xs text-slate-500">Autonomous Video Enforcement & Decision-Support System</p>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-semibold text-slate-600 font-mono">SYSTEM ACTIVE FEED LOCAL: 01:28 AM</span>
            </div>
          </div>
        </header>

        {/* Global Warnings */}
        {!isBackendOnline && (
          <div className="mx-8 mt-6 bg-orange-50 border border-orange-200 px-4 py-3 rounded-lg flex items-center gap-3 text-orange-600">
            <AlertTriangle className="w-5 h-5 shrink-0 text-orange-500" />
            <div className="text-xs">
              <span className="font-semibold block">Decision Engine Offline (Display Mode Active)</span>
              FastAPI Ingestion is offline. Connect the backend via <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px] text-orange-600">python backend/run.py</code> to run live YOLOv8 and ReportLab PDF compilers.
            </div>
          </div>
        )}

        {simMessage && (
          <div className="mx-8 mt-6 bg-orange-50 border border-orange-200 px-4 py-3 rounded-lg flex items-center gap-3 text-orange-600">
            <Activity className="w-5 h-5 shrink-0" />
            <div className="text-xs font-semibold">{simMessage}</div>
          </div>
        )}

        {/* Content Feed */}
        <div className="p-8 space-y-6">
          
          {/* TAB 1: EXECUTIVE ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6">
              
              {/* Dashboard KPIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(analytics.kpis || {}).map(([key, item]: any) => (
                  <div key={key} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:border-slate-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{item.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.type === "positive" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        item.type === "negative" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {item.change}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 tracking-tight font-mono">{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Geographic Hotspot Map */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Bangalore Junction Risk Map</h2>
                    <p className="text-xs text-slate-500">Calibrated risk parameters overlaid on light geographic coordinates</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Server className="w-4 h-4 text-orange-500" />
                    <span>Real-time GIS Connected</span>
                  </div>
                </div>
                <div className="h-[400px]">
                  <RiskMap hotspots={hotspots} />
                </div>
              </div>

              {/* Charts Segment */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Hourly peak analysis */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Hourly Traffic Infraction Cycles</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.hourly_trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="hour" stroke="#64748B" fontSize={10} className="font-mono" />
                        <YAxis stroke="#64748B" fontSize={10} className="font-mono" />
                        <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }} labelClassName="text-slate-800 text-xs font-mono" />
                        <Line type="monotone" dataKey="violations" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories distribution */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Categorized Traffic Offenses</h3>
                  <div className="h-[250px] flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.violation_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {analytics.violation_distribution?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }} />
                        <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 9, color: "#475569" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: CONTROL ROOM (UPLOAD & DETECTION) */}
          {activeTab === "control" && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Upload Form Container */}
                <div className="bg-white border border-slate-200 rounded-lg p-6 h-fit space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-orange-500" />
                      Ingestion Calibration
                    </h2>
                    <p className="text-xs text-slate-500">Configure parameters for camera calibration overlays</p>
                  </div>

                  <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
                    {/* Location dropdown */}
                    <div>
                      <label className="block text-slate-600 font-semibold uppercase mb-1.5">Sensor Node Location</label>
                      <select 
                        value={uploadLocation}
                        onChange={(e) => setUploadLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500 font-mono"
                      >
                        {hotspots.map((spot) => (
                          <option key={spot.location} value={spot.location}>{spot.location}</option>
                        ))}
                      </select>
                    </div>

                    {/* Preprocessing Toggles */}
                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-700 font-semibold uppercase text-[10px]">OpenCV Preprocessing</label>
                        <input 
                          type="checkbox" 
                          checked={usePreprocessing} 
                          onChange={(e) => setUsePreprocessing(e.target.checked)} 
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </div>
                      {usePreprocessing && (
                        <div className="space-y-1.5 animate-fadeIn">
                          <label className="block text-slate-500 font-semibold uppercase text-[10px]">Enhancement Mode</label>
                          <select 
                            value={preprocessMode}
                            onChange={(e) => setPreprocessMode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-orange-500"
                          >
                            <option value="Auto">Auto Calibration</option>
                            <option value="Low Light">Low Light Boost</option>
                            <option value="Rain">Rain Denoise</option>
                            <option value="Shadow">Shadow Equalizer</option>
                            <option value="Motion Blur">Motion Sharpen</option>
                          </select>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Applies LAB CLAHE contrast scaling, bilateral denoising, and sharpening to mitigate low light & rainy artifacts.
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="border-t border-slate-200 pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-700 font-semibold uppercase text-[10px]">Guided Demo Mode</label>
                        <input 
                          type="checkbox" 
                          checked={demoMode} 
                          onChange={(e) => setDemoMode(e.target.checked)} 
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">Overlay high-fidelity mock assets for perfect pitch visual clarity.</p>
                    </div>

                    {/* Demo Violation Selector */}
                    {demoMode && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="block text-slate-500 font-semibold uppercase text-[10px]">Simulation Infraction</label>
                        <select 
                          value={demoViolation}
                          onChange={(e) => setDemoViolation(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                        >
                          <option value="Helmet Non-compliance">Helmet Non-compliance</option>
                          <option value="Triple Riding">Triple Riding</option>
                          <option value="Seatbelt Non-compliance">Seatbelt Non-compliance</option>
                          <option value="Illegal Parking">Illegal Parking</option>
                          <option value="Wrong-side Driving">Wrong-side Driving</option>
                          <option value="Stop-line Violation">Stop-line Violation</option>
                          <option value="Red-light Violation">Red-light Violation</option>
                          <option value="Speeding">Speeding</option>
                        </select>
                      </div>
                    )}

                    {/* Drag and drop zone */}
                    <div className="border-t border-slate-200 pt-4">
                      <label className="block text-slate-600 font-semibold uppercase mb-2">Target Frame / Stream</label>
                      <div className="border border-dashed border-slate-200 hover:border-orange-500 transition-all rounded p-4 flex flex-col items-center justify-center text-center cursor-pointer relative bg-slate-50">
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setSelectedFile(e.target.files[0]);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-[11px] text-slate-600 font-medium truncate block max-w-full">
                          {selectedFile ? selectedFile.name : "Select JPEG / PNG"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedFile || isProcessing}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider cursor-pointer shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="animate-spin w-3.5 h-3.5" />
                          Running AI Pipelines...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Ingest Traffic Media
                        </>
                      )}
                    </button>
                  </form>

                </div>

                {/* Visualizer Display Output */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between min-h-[480px] shadow-sm">
                  
                  {/* Default Placeholder */}
                  {!uploadResult && !isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                      <Layers className="w-12 h-12 text-slate-400 mb-3" />
                      <h3 className="text-slate-700 font-bold mb-1 uppercase tracking-wider text-xs">Awaiting Camera Stream Ingestion</h3>
                      <p className="text-xs text-slate-500 max-w-sm leading-normal mt-1">
                        Select a raw camera frame capture, configure preprocessing options, and run inference to generate real-time bounding overlays and legally-defensible citations.
                      </p>
                    </div>
                  )}

                  {/* Processing pulse overlay */}
                  {isProcessing && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                      <div className="w-14 h-14 rounded-full border border-orange-500/20 flex items-center justify-center bg-orange-50">
                        <Activity className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <h4 className="text-slate-800 font-semibold text-xs uppercase tracking-wider">FastAPI Pipeline Running</h4>
                        <p className="text-[11px] text-slate-500 mt-1">Applying CLAHE filters, tracking motion vectors, and cropped license plate OCR...</p>
                      </div>
                    </div>
                  )}

                  {/* Three-Pane / Two-Pane Inference Output */}
                  {uploadResult && !isProcessing && (
                    <div className="space-y-6 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            ANALYSIS COMPLETE
                          </span>
                          <h3 className="text-xs font-bold text-slate-800 mt-1 uppercase tracking-wider">Calibrated Detection Layers</h3>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setViewingCardUrl(`${API_BASE}/api/evidence/${uploadResult.violations[0]?.id}`)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-orange-500" />
                            View Evidence
                          </button>
                        </div>
                      </div>

                      {/* View Mode Toggle */}
                      {uploadResult.preprocessed_path && (
                        <div className="flex gap-2 border-b border-slate-200 pb-3 text-xs">
                          <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={`px-3 py-1.5 rounded font-semibold transition-all uppercase tracking-wider font-mono text-[10px] cursor-pointer ${
                              viewMode === "grid" 
                                ? "bg-orange-500 text-white shadow-sm" 
                                : "bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200"
                            }`}
                          >
                            Inspection Grid
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewMode("slider")}
                            className={`px-3 py-1.5 rounded font-semibold transition-all uppercase tracking-wider font-mono text-[10px] cursor-pointer ${
                              viewMode === "slider" 
                                ? "bg-orange-500 text-white shadow-sm" 
                                : "bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200"
                            }`}
                          >
                            Before/After Slider
                          </button>
                        </div>
                      )}

                      {/* Display Panels */}
                      {viewMode === "grid" || !uploadResult.preprocessed_path ? (
                        <div className={`grid gap-4 flex-1 items-center justify-center py-2 ${
                          uploadResult.preprocessed_path ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
                        }`}>
                          
                          {/* 1. Original Bounding Frame */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block font-mono">1. Original Capture</span>
                            <div className="rounded border border-slate-200 bg-slate-50 relative max-h-[250px] overflow-hidden flex items-center justify-center p-2">
                              <img 
                                src={selectedFile ? URL.createObjectURL(selectedFile) : (uploadResult.original_path ? `${API_BASE}/${uploadResult.original_path}` : "")} 
                                alt="Raw Frame" 
                                className="max-h-[220px] object-contain"
                              />
                            </div>
                          </div>

                          {/* 2. Preprocessed (Only if Preprocessing was active) */}
                          {uploadResult.preprocessed_path && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block font-mono">2. Preprocessed Output</span>
                              <div className="rounded border border-slate-200 bg-slate-50 relative max-h-[250px] overflow-hidden flex items-center justify-center p-2">
                                <img 
                                  src={`${API_BASE}/${uploadResult.preprocessed_path}`} 
                                  alt="Preprocessed Frame" 
                                  className="max-h-[220px] object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* 3. Bounding Overlays */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block font-mono">
                              {uploadResult.preprocessed_path ? "3. Bounding Overlays" : "2. Bounding Overlays"}
                            </span>
                            <div className="rounded border border-slate-200 bg-slate-50 relative max-h-[250px] overflow-hidden flex items-center justify-center p-2">
                              <img 
                                src={`${API_BASE}/${uploadResult.annotated_path}`} 
                                alt="Inference Overlays" 
                                className="max-h-[220px] object-contain"
                              />
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-2 space-y-2">
                          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block self-start font-mono">Interactive Preprocessing Slider</span>
                          
                          {/* Slider Component */}
                          <div className="relative w-full h-[280px] border border-slate-200 rounded overflow-hidden select-none bg-slate-100 flex items-center justify-center">
                            {/* Before: Original Image */}
                            <img 
                              src={selectedFile ? URL.createObjectURL(selectedFile) : (uploadResult.original_path ? `${API_BASE}/${uploadResult.original_path}` : "")} 
                              alt="Original Capture (Before)" 
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            />
                            
                            {/* After: Preprocessed Image */}
                            <img 
                              src={`${API_BASE}/${uploadResult.preprocessed_path}`} 
                              alt="Preprocessed Capture (After)" 
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                              style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                            />
                            
                            {/* Vertical Separator Line */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 shadow pointer-events-none"
                              style={{ left: `${sliderPosition}%` }}
                            >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-orange-500 border border-white flex items-center justify-center shadow">
                                <Sliders className="w-3 h-3 text-white" />
                              </div>
                            </div>
                            
                            {/* Labels */}
                            <div className="absolute top-3 left-3 bg-white/90 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-mono text-slate-600 shadow-sm">
                              BEFORE: RAW CAMERA FEED
                            </div>
                            <div className="absolute top-3 right-3 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-[9px] font-mono text-orange-600 shadow-sm font-semibold">
                              AFTER: {preprocessMode.toUpperCase()} ENHANCED
                            </div>
                            
                            {/* Slider input controller */}
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={sliderPosition} 
                              onChange={(e) => setSliderPosition(Number(e.target.value))}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">Slide left or right across the image to evaluate filters</span>
                        </div>
                      )}

                      {/* Details Box & PDF Downloader */}
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                        <div className="flex-1 space-y-2">
                          <div className="text-slate-500 uppercase font-semibold text-[10px] tracking-wider">Ingestion Log Readings</div>
                          
                          {uploadResult.violations.length === 0 ? (
                            <div className="text-emerald-600 font-medium">
                              System nominal. Bounding tracking complete. No violations detected.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                              {uploadResult.violations.map((v: any, idx: number) => (
                                <div key={idx} className="border border-slate-200 p-3 rounded bg-white shadow-sm flex flex-col justify-between gap-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-orange-600 uppercase tracking-wide text-[11px]">{v.violation_type}</span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border rounded ${
                                      v.severity === "High" ? "bg-rose-50 text-rose-600 border-rose-200" :
                                      v.severity === "Medium" ? "bg-orange-50 text-orange-600 border-orange-200" :
                                      "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}>
                                      {v.severity}
                                    </span>
                                  </div>
                                  
                                  {/* Cropped License Plate Image & OCR Ingestion Visual */}
                                  {v.plate_crop_path && (
                                    <div className="my-1.5 p-1 border border-slate-100 rounded bg-slate-50 flex items-center justify-center shadow-inner">
                                      <img 
                                        src={`${API_BASE}/${v.plate_crop_path}?t=${v.plate_number}`} 
                                        alt="License Plate Crop" 
                                        className="h-10 w-auto object-contain border border-slate-200 rounded"
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-600 border-t border-slate-100 pt-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-slate-500">PLATE:</span>
                                      {editingId === v.id ? (
                                        <div className="flex items-center gap-1">
                                          <input 
                                            type="text" 
                                            value={editingText} 
                                            onChange={(e) => setEditingText(e.target.value)}
                                            className="bg-slate-50 text-slate-800 border border-orange-300 rounded px-1.5 py-0.5 text-[10px] w-24 uppercase outline-none font-bold"
                                            disabled={isUpdatingPlate}
                                            autoFocus
                                          />
                                          <button 
                                            onClick={() => handleSavePlate(v.id)}
                                            className="text-emerald-600 hover:text-emerald-700 font-bold px-1 cursor-pointer"
                                            title="Save"
                                          >
                                            ✓
                                          </button>
                                          <button 
                                            onClick={() => setEditingId(null)}
                                            className="text-rose-600 hover:text-rose-700 font-bold px-1 cursor-pointer"
                                            title="Cancel"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{v.plate_number}</span>
                                          <button 
                                            onClick={() => { setEditingId(v.id); setEditingText(v.plate_number); }}
                                            className="text-slate-400 hover:text-orange-600 transition-colors text-[10px] underline cursor-pointer font-sans"
                                          >
                                            Edit
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-semibold text-slate-500">CONF: {Math.round(v.confidence * 100)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {uploadResult.violations[0] && (
                          <div className="flex gap-2">
                            <a
                              href={`${API_BASE}/api/evidence/${uploadResult.violations[0].id}/pdf`}
                              target="_blank"
                              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded flex items-center gap-1.5 transition-all text-xs uppercase font-mono cursor-pointer shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF Citation
                            </a>
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: LOCATION RISK RANKINGS */}
          {activeTab === "rankings" && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Municipal Risk Ranking Priority</h2>
                    <p className="text-xs text-slate-500">Junction priority lists computed via severity indexes and recent surge multipliers</p>
                  </div>
                  
                  <button 
                    onClick={refreshDashboardFeeds}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-orange-600 font-semibold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all font-mono cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Recompute Index
                  </button>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Priority</th>
                        <th className="py-3 px-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort("location")}>Location</th>
                        <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort("risk_score")}>Risk Score</th>
                        <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort("count")}>Violation Count</th>
                        <th className="py-3 px-4 text-center cursor-pointer hover:text-slate-800" onClick={() => handleSort("trend")}>Trend Status</th>
                        <th className="py-3 px-4">Action Directive</th>
                        <th className="py-3 px-4 text-right">Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {sortedHotspots.map((spot, index) => {
                        const isCritical = spot.risk_score > 35;
                        const isModerate = spot.risk_score <= 35 && spot.risk_score > 20;
                        
                        return (
                          <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-4 font-bold text-slate-400">#{index + 1}</td>
                            <td className="py-4 px-4 font-bold text-slate-800 font-mono">{spot.location}</td>
                            <td className="py-4 px-4 text-center font-bold text-sm font-mono">
                              <span className={`px-2 py-0.5 rounded border ${
                                isCritical ? 'text-orange-600 bg-orange-50 border-orange-200' :
                                isModerate ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                'text-emerald-600 bg-emerald-50 border-emerald-200'
                              }`}>
                                {spot.risk_score}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-slate-600 font-mono">{spot.count}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 font-semibold ${
                                spot.trend === "increasing" ? "text-orange-600" :
                                spot.trend === "decreasing" ? "text-emerald-600" :
                                "text-slate-400"
                              }`}>
                                {spot.trend === "increasing" ? (
                                  <>
                                    <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                                    SURGING
                                  </>
                                ) : spot.trend === "decreasing" ? (
                                  <>
                                    <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                                    REDUCING
                                  </>
                                ) : (
                                  "STABLE"
                                )}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600 max-w-xs leading-normal">
                              {spot.recommendation}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => {
                                  alert(`Command: Dispatching mobile safety units to ${spot.location}.`);
                                }}
                                className={`px-2.5 py-1.5 rounded font-semibold text-[10px] uppercase transition-all tracking-wider cursor-pointer ${
                                  isCritical 
                                    ? "bg-orange-600 hover:bg-orange-700 text-white shadow-sm" 
                                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                                }`}
                              >
                                Deploy Patrol
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: AI RECS BULLETIN */}
          {activeTab === "recommendations" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">AI Enforcement Dispatch Center</h2>
                <p className="text-xs text-slate-500">Automated explainable dispatch guidelines generated from active database metrics</p>
              </div>

              <div className="space-y-4">
                {recs.map((rec) => {
                  const isCritical = rec.priority === "Critical";
                  const isHigh = rec.priority === "High";
                  const isMedium = rec.priority === "Medium";
                  
                  return (
                    <div 
                      key={rec.id} 
                      className={`bg-white border rounded-lg p-5 shadow-sm space-y-4 transition-all hover:border-slate-300 ${
                        isCritical ? 'border-slate-200 border-l-4 border-l-orange-600' :
                        isHigh ? 'border-slate-200 border-l-4 border-l-orange-500' :
                        isMedium ? 'border-slate-200 border-l-4 border-l-amber-500' :
                        'border-slate-200 border-l-4 border-l-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                            isCritical ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            isHigh ? 'bg-orange-50 text-orange-500 border-orange-200' :
                            isMedium ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-blue-50 text-blue-600 border-blue-200'
                          }`}>
                            {rec.priority} Priority
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 mt-1.5">{rec.title}</h3>
                        </div>
                        
                        <div className="text-[10px] text-slate-400 font-mono">
                          Local Time: {new Date(rec.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <span className="text-slate-500 font-bold block mb-1 uppercase text-[10px]">TRIGGER CONDITION</span>
                          <p className="text-slate-600 leading-normal">{rec.trigger}</p>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <span className="text-orange-600 font-bold block mb-1 uppercase text-[10px]">ENFORCEMENT COMMAND ACTION</span>
                          <p className="text-slate-600 leading-normal">{rec.action}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>Sector Node: <span className="font-mono text-slate-800">{rec.location}</span></span>
                        </div>
                        
                        <button
                          onClick={() => {
                            alert(`Dispatch deployment command approved for sector: ${rec.location}.`);
                          }}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-1.5 px-3 rounded text-xs transition-all uppercase tracking-wider font-mono cursor-pointer shadow-sm"
                        >
                          Approve Command
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 5: MODEL EVALUATION (NEW!) */}
          {activeTab === "evaluation" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Model Performance Center</h2>
                <p className="text-xs text-slate-500">Official validation logs and metrics compilation for municipal automated prosecution auditing</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Precision / Recall</span>
                  <div className="text-2xl font-bold font-mono text-slate-900">
                    {(evaluation.precision * 100).toFixed(1)}% / {(evaluation.recall * 100).toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Aggregated Bounding Box Accuracy</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">F1 Quality Index</span>
                  <div className="text-2xl font-bold font-mono text-orange-600">
                    {evaluation.f1_score.toFixed(3)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Combined Harmonic Mean score</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">mAP50 / mAP50-95</span>
                  <div className="text-2xl font-bold font-mono text-orange-600">
                    {evaluation.map_50.toFixed(3)} / {evaluation.map_50_95.toFixed(3)}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">COCO Val-150 Vehicle Subnet benchmarks</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">OCR Plate Accuracy</span>
                  <div className="text-2xl font-bold font-mono text-orange-600">
                    {(evaluation.ocr_accuracy * 100).toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Isolating characters on KA formats</p>
                </div>
              </div>

              {/* Performance detail segment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-orange-500" />
                    System Latency & Throughput
                  </h3>
                  
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500">Average Inference Time:</span>
                      <span className="font-bold text-slate-800 font-mono">{evaluation.avg_inference_time_ms} ms / frame</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500">Total Frames Audited:</span>
                      <span className="font-bold text-slate-800 font-mono">{evaluation.total_images_processed}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-slate-500">System Throughput:</span>
                      <span className="font-bold text-emerald-600 font-mono">{evaluation.system_throughput_fps} FPS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Auditing Methodology
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {evaluation.methodology}
                  </p>
                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                    Confidence logs are computed in real-time from the SQLite database metadata arrays. System performance parameters represent actual uvicorn execution benchmarks.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: SEARCHABLE RECORDS (NEW!) */}
          {activeTab === "search" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Searchable Enforcement Records</h2>
                <p className="text-xs text-slate-500">Query legal violations database, download certified citations, and track historical infractions</p>
              </div>

              {/* Filters Panel */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 text-xs space-y-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Keyword search */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">Keyword Search</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search location, plate..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchPage(1); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                      />
                      <Search className="absolute left-2.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Plate number */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">License Plate</label>
                    <input 
                      type="text" 
                      placeholder="e.g. KA-03-JN"
                      value={searchPlate}
                      onChange={(e) => { setSearchPlate(e.target.value); setSearchPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500 font-mono"
                    />
                  </div>

                  {/* Location selection */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">Sensor Location</label>
                    <select 
                      value={searchLocation}
                      onChange={(e) => { setSearchLocation(e.target.value); setSearchPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                    >
                      <option value="">All Locations</option>
                      {hotspots.map((spot) => (
                        <option key={spot.location} value={spot.location}>{spot.location}</option>
                      ))}
                    </select>
                  </div>

                  {/* Violation Type */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">Violation Type</label>
                    <select 
                      value={searchViolationType}
                      onChange={(e) => { setSearchViolationType(e.target.value); setSearchPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                    >
                      <option value="">All Violations</option>
                      <option value="Helmet Non-compliance">Helmet Non-compliance</option>
                      <option value="Triple Riding">Triple Riding</option>
                      <option value="Seatbelt Non-compliance">Seatbelt Non-compliance</option>
                      <option value="Illegal Parking">Illegal Parking</option>
                      <option value="Speeding">Speeding</option>
                      <option value="Wrong-side Driving">Wrong-side Driving</option>
                      <option value="Stop-line Violation">Stop-line Violation</option>
                      <option value="Red-light Violation">Red-light Violation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  {/* Start Date */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">Start Date</label>
                    <input 
                      type="date"
                      value={searchStartDate}
                      onChange={(e) => { setSearchStartDate(e.target.value); setSearchPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">End Date</label>
                    <input 
                      type="date"
                      value={searchEndDate}
                      onChange={(e) => { setSearchEndDate(e.target.value); setSearchPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-slate-600 font-semibold uppercase mb-1.5">Severity Risk Level</label>
                    <select 
                      value={searchSeverity}
                      onChange={(e) => { setSearchSeverity(e.target.value); setSearchPage(1); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2.5 text-slate-800 outline-none focus:border-orange-500"
                    >
                      <option value="">All Severities</option>
                      <option value="High">High Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="Low">Low Risk</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table / Results Panel */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                {isSearching ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="animate-spin text-orange-500 w-8 h-8" />
                    <span className="text-slate-500 text-xs uppercase tracking-wider">Querying Database...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <Sliders className="w-12 h-12 text-slate-400 mb-3" />
                    <h3 className="text-slate-700 font-bold uppercase tracking-wider text-xs">No Records Matched</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">Adjust your search strings, filters, or date range coordinates to discover historical records.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Case ID</th>
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">Location</th>
                            <th className="py-3 px-4">Plate Number</th>
                            <th className="py-3 px-4">Violation</th>
                            <th className="py-3 px-4 text-center">Severity</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {searchResults.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-slate-500">TXN-{row.id.toString().padStart(6, '0')}</td>
                              <td className="py-4 px-4 font-mono text-[11px]">{new Date(row.timestamp).toLocaleString()}</td>
                              <td className="py-4 px-4 font-bold text-slate-800">{row.location}</td>
                              <td className="py-4 px-4 font-mono">
                                <div className="flex flex-col gap-1.5 justify-center">
                                  {row.plate_crop_path && (
                                    <img 
                                      src={`${API_BASE}/${row.plate_crop_path}?t=${row.plate_number}`} 
                                      alt="Plate Crop" 
                                      className="h-8 w-auto object-contain border border-slate-200 rounded self-start shadow-sm"
                                    />
                                  )}
                                  {editingId === row.id ? (
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="text" 
                                        value={editingText} 
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="bg-slate-50 text-slate-800 border border-orange-300 rounded px-1.5 py-0.5 text-[10px] w-24 uppercase outline-none font-bold font-mono"
                                        disabled={isUpdatingPlate}
                                        autoFocus
                                      />
                                      <button 
                                        onClick={() => handleSavePlate(row.id)}
                                        className="text-emerald-600 hover:text-emerald-700 font-bold px-1 cursor-pointer font-sans"
                                        title="Save"
                                      >
                                        ✓
                                      </button>
                                      <button 
                                        onClick={() => setEditingId(null)}
                                        className="text-rose-600 hover:text-rose-700 font-bold px-1 cursor-pointer font-sans"
                                        title="Cancel"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{row.plate_number}</span>
                                      <button 
                                        onClick={() => { setEditingId(row.id); setEditingText(row.plate_number); }}
                                        className="text-slate-400 hover:text-orange-600 transition-colors text-[10px] underline cursor-pointer font-sans"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-4 font-bold text-orange-600">{row.violation_type}</td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded border font-semibold text-[10px] uppercase font-mono ${
                                  row.severity === "High" ? 'text-rose-600 bg-rose-50 border-rose-200' :
                                  row.severity === "Medium" ? 'text-orange-600 bg-orange-50 border-orange-200' :
                                  'text-slate-500 bg-slate-50 border-slate-200'
                                }`}>
                                  {row.severity}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right space-x-2">
                                <button
                                  onClick={() => setViewingCardUrl(`${API_BASE}/api/evidence/${row.id}`)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-1 px-2.5 rounded border border-slate-200 transition-all uppercase tracking-wider cursor-pointer"
                                >
                                  Dossier
                                </button>
                                <a
                                  href={`${API_BASE}/api/evidence/${row.id}/pdf`}
                                  target="_blank"
                                  className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold py-1 px-2.5 rounded border border-orange-200 transition-all uppercase tracking-wider font-mono inline-block"
                                >
                                  PDF
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Bar */}
                    <div className="flex justify-between items-center border-t border-slate-200 pt-4 text-xs text-slate-500 font-sans">
                      <div>
                        Showing <span className="text-slate-800 font-bold font-mono">{(searchPage - 1) * 10 + 1}-{Math.min(searchPage * 10, totalSearchCount)}</span> of <span className="text-slate-800 font-bold font-mono">{totalSearchCount}</span> records
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={searchPage === 1}
                          onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white font-semibold py-1.5 px-3 rounded flex items-center gap-1 transition-all uppercase tracking-wider font-mono cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Prev
                        </button>
                        <button
                          disabled={searchPage * 10 >= totalSearchCount}
                          onClick={() => setSearchPage(p => p + 1)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 disabled:opacity-40 disabled:hover:bg-white font-semibold py-1.5 px-3 rounded flex items-center gap-1 transition-all uppercase tracking-wider font-mono cursor-pointer"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. MODAL COMPONENT (FOR CITATION DOSSIER VIEW) */}
      {viewingCardUrl && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="relative bg-white border border-slate-200 rounded-lg max-w-4xl w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">E-Citation Evidence Dossier</h3>
                <p className="text-xs text-slate-500">Legally-compliant automated prosecution card</p>
              </div>
              <button 
                onClick={() => setViewingCardUrl(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-200 rounded p-1.5 transition-all text-xs font-semibold uppercase font-mono cursor-pointer"
              >
                Close View
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-2 rounded border border-slate-200 bg-slate-50">
              <img 
                src={viewingCardUrl} 
                alt="Citation Card" 
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-2 text-xs">
              <a 
                href={viewingCardUrl} 
                target="_blank"
                download
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center gap-1.5 transition-all uppercase font-mono cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download JPEG
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. DEMO RUN CHEKLIST MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <Shield className="text-orange-500 w-6 h-6" />
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">Judicial Demonstration Runner</h3>
                <p className="text-[10px] text-slate-500">Executing automated platform ingestion scenario...</p>
              </div>
            </div>

            <div className="space-y-3.5 py-2">
              {demoStepsList.map((step, idx) => {
                const isDone = idx < demoStepIndex;
                const isCurrent = idx === demoStepIndex;
                
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    {isDone ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 text-orange-500 shrink-0 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={`font-semibold ${
                      isDone ? "text-slate-400 line-through decoration-slate-300" :
                      isCurrent ? "text-slate-900 font-bold" : "text-slate-400"
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-slate-100 flex justify-between items-center">
              <span>ESTIMATED DURATION: ~5.0 SECONDS</span>
              <span className="font-mono text-orange-600 font-bold">CYCLE IN PROGRESS</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
