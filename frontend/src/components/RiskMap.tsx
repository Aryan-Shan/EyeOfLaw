/* eslint-disable */
"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

// Fix Leaflet's default marker icon asset paths
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

interface Hotspot {
  location: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  count: number;
  trend: "increasing" | "decreasing" | "stable";
  recommendation: string;
}

interface RiskMapProps {
  hotspots: Hotspot[];
}

export default function RiskMap({ hotspots }: RiskMapProps) {
  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Center around Bangalore central coords
  const mapCenter: [number, number] = [12.9716, 77.5946];

  const getRiskColor = (score: number) => {
    if (score > 35) return "#ea580c"; // Dark Orange/Red (Danger)
    if (score > 20) return "#f97316"; // Orange (Warning)
    return "#10b981"; // Green (Success)
  };

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-md relative bg-slate-50">
      <MapContainer 
        center={mapCenter} 
        zoom={12} 
        scrollWheelZoom={true}
        className="w-full h-full min-h-[400px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" // Light CartoDB Map
        />
        
        {hotspots.map((spot, index) => {
          const riskColor = getRiskColor(spot.risk_score);
          return (
            <div key={index}>
              {/* Highlight Circle area */}
              <Circle
                center={[spot.latitude, spot.longitude]}
                radius={350 + spot.risk_score * 8}
                pathOptions={{
                  color: riskColor,
                  fillColor: riskColor,
                  fillOpacity: 0.15,
                  weight: 1.5
                }}
              />
              
              {/* Hotspot pin marker */}
              <Marker position={[spot.latitude, spot.longitude]}>
                <Popup>
                  <div className="p-1 font-sans text-[11px] leading-relaxed">
                    <h3 className="font-bold text-slate-800 text-xs mb-1 font-mono uppercase tracking-wider">{spot.location}</h3>
                    
                    <div className="grid grid-cols-2 gap-2 my-2 py-1 border-y border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">RISK LEVEL</span>
                        <span className="text-xs font-bold font-mono" style={{ color: riskColor }}>
                          {spot.risk_score}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-semibold">VIOLATIONS</span>
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {spot.count}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-slate-500 text-[9px] uppercase font-semibold">TREND STATUS</span>
                      <span className="text-[10px] text-slate-700 font-bold flex items-center gap-1">
                        {spot.trend === "increasing" ? (
                          <>
                            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                            INCREASING
                          </>
                        ) : spot.trend === "decreasing" ? (
                          <>
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                            DECREASING
                          </>
                        ) : (
                          "STABLE"
                        )}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-slate-500 font-bold block text-[9px] uppercase mb-0.5">DIRECTIVE ACTION:</span>
                      <p className="text-slate-700 leading-relaxed bg-slate-50 p-1.5 rounded text-[10px] border border-slate-200">
                        {spot.recommendation}
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
      
      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white border border-slate-200 p-3 rounded text-[10px] font-sans shadow-md">
        <h4 className="font-semibold text-slate-800 mb-2 uppercase tracking-wider text-[9px]">Junction Risk Index</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block opacity-75"></span>
            <span className="text-slate-600">Critical Priority (&gt;35)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block opacity-75"></span>
            <span className="text-slate-600">Moderate Priority (20-35)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block opacity-75"></span>
            <span className="text-slate-600">Low Priority (&lt;20)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
