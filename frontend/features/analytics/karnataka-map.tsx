"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import type { PredictionResultItem } from "@/features/admissions/types";

const DISTRICT_COORDS: Record<string, { x: number; y: number }> = {
  "Bengaluru": { x: 540, y: 340 },
  "Bengaluru Rural": { x: 530, y: 320 },
  "Bengaluru Urban": { x: 545, y: 335 },
  "Mysuru": { x: 490, y: 410 },
  "Mysore": { x: 490, y: 410 },
  "Belagavi": { x: 310, y: 150 },
  "Belgaum": { x: 310, y: 150 },
  "Hubballi": { x: 330, y: 190 },
  "Hubli": { x: 330, y: 190 },
  "Dharwad": { x: 340, y: 185 },
  "Mangaluru": { x: 370, y: 370 },
  "Mangalore": { x: 370, y: 370 },
  "Dakshina Kannada": { x: 380, y: 380 },
  "Udupi": { x: 390, y: 330 },
  "Shivamogga": { x: 420, y: 270 },
  "Shimoga": { x: 420, y: 270 },
  "Tumakuru": { x: 480, y: 280 },
  "Tumkur": { x: 480, y: 280 },
  "Ballari": { x: 460, y: 195 },
  "Bellary": { x: 460, y: 195 },
  "Vijayapura": { x: 380, y: 140 },
  "Bijapur": { x: 380, y: 140 },
  "Kalaburagi": { x: 510, y: 100 },
  "Gulbarga": { x: 510, y: 100 },
  "Davangere": { x: 420, y: 250 },
  "Hassan": { x: 450, y: 340 },
  "Mandya": { x: 500, y: 380 },
  "Chitradurga": { x: 440, y: 240 },
  "Raichur": { x: 530, y: 140 },
  "Kolar": { x: 570, y: 290 },
  "Chikkaballapur": { x: 560, y: 270 },
  "Ramanagara": { x: 520, y: 350 },
  "Kodagu": { x: 400, y: 400 },
  "Chikkamagaluru": { x: 410, y: 310 },
  "Chikmagalur": { x: 410, y: 310 },
  "Haveri": { x: 360, y: 220 },
  "Gadag": { x: 350, y: 200 },
  "Bagalkote": { x: 340, y: 160 },
  "Bidar": { x: 550, y: 70 },
  "Yadgir": { x: 550, y: 120 },
  "Koppal": { x: 460, y: 170 },
  "Uttara Kannada": { x: 300, y: 250 },
  "Karwar": { x: 290, y: 240 },
  "Vijayanagara": { x: 470, y: 180 },
};

const MAP_W = 700;
const MAP_H = 500;
const MAP_PADDING = 40;
const VIEW_BOX = `${-MAP_PADDING} ${-MAP_PADDING} ${MAP_W + MAP_PADDING * 2} ${MAP_H + MAP_PADDING * 2}`;

type DistrictInfo = { name: string; count: number; colleges: PredictionResultItem[] };

export function KarnatakaMap({ data }: { data: PredictionResultItem[] }) {
  const [hovered, setHovered] = useState<DistrictInfo | null>(null);

  const districtData = useMemo(() => {
    const map = new Map<string, PredictionResultItem[]>();
    data.forEach((m) => {
      const key = m.district || m.city || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [data]);

  const districts = useMemo(() => {
    return Object.entries(DISTRICT_COORDS).map(([name, coords]) => {
      const colleges = districtData.get(name) || [];
      const aliases: Record<string, string[]> = {
        Bengaluru: ["Bengaluru", "Bangalore"],
        Mysuru: ["Mysuru", "Mysore"],
        Mangaluru: ["Mangaluru", "Mangalore"],
        Shivamogga: ["Shivamogga", "Shimoga"],
        Tumakuru: ["Tumakuru", "Tumkur"],
        Ballari: ["Ballari", "Bellary"],
        Vijayapura: ["Vijayapura", "Bijapur"],
        Kalaburagi: ["Kalaburagi", "Gulbarga"],
        Hubballi: ["Hubballi", "Hubli"],
        "Chikkamagaluru": ["Chikkamagaluru", "Chikmagalur"],
        "Dakshina Kannada": ["Dakshina Kannada", "Mangaluru", "Mangalore"],
      };
      const aliasList = aliases[name] || [name];
      let allColleges: PredictionResultItem[] = [...colleges];
      for (const alias of aliasList) {
        if (alias !== name && districtData.has(alias)) {
          allColleges = [...allColleges, ...districtData.get(alias)!];
        }
      }
      return { name, x: coords.x, y: coords.y, count: allColleges.length, colleges: allColleges };
    }).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  }, [districtData]);

  const maxCount = Math.max(...districts.map((d) => d.count), 1);

  if (!districts.length) {
    return (
      <div className="rounded-lg border border-[var(--border)] p-4 text-center">
        <MapPin className="h-5 w-5 mx-auto mb-2 text-[var(--muted)]" />
        <p className="text-xs text-[var(--muted)]">Run a prediction to see colleges on the map</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-lg border border-[var(--border)] p-4">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-[var(--foreground)]">College Map</h4>
        <p className="text-[10px] text-[var(--muted)]">{districts.length} districts with colleges</p>
      </div>
      <div className="relative overflow-x-auto">
        <svg viewBox={VIEW_BOX} className="w-full max-w-full" style={{ minHeight: 400 }}>
          {districts.map((d) => {
            const radius = 8 + (d.count / maxCount) * 24;
            const opacity = 0.4 + (d.count / maxCount) * 0.6;
            return (
              <g key={d.name}>
                <circle cx={d.x} cy={d.y} r={radius + 4} fill="var(--primary)" opacity={opacity * 0.15} className="transition-all duration-300" />
                <circle
                  cx={d.x} cy={d.y} r={radius}
                  fill="var(--primary)" fillOpacity={opacity}
                  stroke="var(--primary)" strokeWidth={1.5}
                  className="cursor-pointer transition-all duration-300 hover:stroke-[2.5]"
                  onMouseEnter={() => setHovered(d)}
                  onMouseLeave={() => setHovered(null)}
                />
                <text x={d.x} y={d.y + radius + 12} textAnchor="middle" fontSize={9} fill="var(--muted)" className="pointer-events-none select-none">
                  {d.name}
                </text>
                <text x={d.x} y={d.y + 1} textAnchor="middle" fontSize={8} fill="var(--primary-foreground)" fontWeight={700} className="pointer-events-none select-none">
                  {d.count}
                </text>
              </g>
            );
          })}
        </svg>
        {hovered && (
          <div className="absolute rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs shadow-xl pointer-events-none" style={{ left: "50%", top: "100%", transform: "translateX(-50%)" }}>
            <p className="font-semibold text-[var(--foreground)]">{hovered.name}</p>
            <p className="text-[var(--muted)]">{hovered.count} college{hovered.count !== 1 ? "s" : ""}</p>
            {hovered.colleges.slice(0, 3).map((c, i) => (
              <p key={i} className="text-[10px] text-[var(--muted)] truncate max-w-48">{c.collegeName}</p>
            ))}
            {hovered.colleges.length > 3 && <p className="text-[10px] text-[var(--muted)]">+{hovered.colleges.length - 3} more</p>}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--muted)]">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--primary)] opacity-40" /> Few</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)] opacity-70" /> Medium</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-[var(--primary)]" /> Many</span>
      </div>
    </motion.div>
  );
}
