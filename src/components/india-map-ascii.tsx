'use client';

import { useState } from 'react';

// Latitudinal scanline slices shaping the geographic silhouette of India
// from 37.1° N (Indira Col) to 8.4° N (Kanyakumari), including Gujarat on the West and Assam/NE on the East.
const INDIA_SCANLINES = [
  { lat: '36°N', offset: 42, width: 8, label: 'Kashmir / Ladakh' },
  { lat: '35°N', offset: 40, width: 12, label: 'Gilgit-Baltistan / Siachen' },
  { lat: '34°N', offset: 38, width: 16, label: 'Srinagar / Leh' },
  { lat: '33°N', offset: 36, width: 19, label: 'Jammu & Kashmir' },
  { lat: '32°N', offset: 35, width: 22, label: 'Himachal Pradesh' },
  { lat: '31°N', offset: 33, width: 25, label: 'Punjab / Uttarakhand' },
  { lat: '30°N', offset: 32, width: 27, label: 'Haryana / Dehradun' },
  { lat: '29°N', offset: 29, width: 32, label: 'Delhi NCR / W. UP' },
  { lat: '28°N', offset: 25, width: 37, label: 'Rajasthan / Jaipur' },
  { lat: '27°N', offset: 22, width: 42, label: 'Thar / Uttar Pradesh' },
  { lat: '26°N', offset: 18, width: 52, label: 'Jodhpur / Lucknow / Bihar' },
  { lat: '25°N', offset: 15, width: 62, label: 'Gujarat Border / Varanasi / Assam', highlightEast: true },
  { lat: '24°N', offset: 12, width: 72, label: 'Rann of Kutch / MP / WB Delta / Meghalaya', isWB: true },
  { lat: '23°N', offset: 10, width: 75, label: 'Tropic of Cancer / Kolkata Node / Tripura', isWB: true },
  { lat: '22°N', offset: 8, width: 73, label: 'Kathiawar / Ranchi / Sundarbans', isWB: true },
  { lat: '21°N', offset: 12, width: 66, label: 'Gulf of Khambhat / Odisha Coast' },
  { lat: '20°N', offset: 16, width: 60, label: 'Maharashtra / Chhattisgarh / Puri' },
  { lat: '19°N', offset: 18, width: 54, label: 'Mumbai / Godavari Basin' },
  { lat: '18°N', offset: 20, width: 48, label: 'Pune / Telangana / Visakhapatnam' },
  { lat: '17°N', offset: 22, width: 44, label: 'Hyderabad / Krishna Delta' },
  { lat: '16°N', offset: 23, width: 40, label: 'Goa / Andhra Pradesh' },
  { lat: '15°N', offset: 24, width: 37, label: 'Hubli / Rayalaseema' },
  { lat: '14°N', offset: 25, width: 34, label: 'Karnataka Plateau' },
  { lat: '13°N', offset: 26, width: 31, label: 'Bengaluru / Chennai Coast' },
  { lat: '12°N', offset: 27, width: 27, label: 'Mysuru / Salem' },
  { lat: '11°N', offset: 28, width: 24, label: 'Coimbatore / Kaveri' },
  { lat: '10°N', offset: 29, width: 21, label: 'Kochi / Madurai' },
  { lat: '09°N', offset: 31, width: 16, label: 'Thiruvananthapuram' },
  { lat: '08°N', offset: 33, width: 11, label: 'Kanyakumari / Cape Comorin' },
];

const ASCII_ART_INDIA = `
                     /\\
                    /  \\
                   /    \\  <36°N Kashmir>
                  |      \\
                 /        \\
              __/          \\__
             /                \\
          __/                  \\
         /     RAJASTHAN        \\___
       _/                           \\__
      /     GUJARAT                    \\____  ASSAM & NE
     /           MADHYA PRADESH             \\____/\\
     \\__                                           /
        \\      MAHARASHTRA        [WB_NODE]       /
         \\                        WEST BENGAL    /
          \\                           KOLKATA   /
           \\       TELANGANA         /~~~~~~~~~
            \\                       /
             \\      KARNATAKA      /
              \\                   /
               \\    TAMIL NADU   /
                \\               /
                 \\  KERALA     /
                  \\           /
                   \\         /
                    \\_______/
                        V  <08°N Kanyakumari>
                        o  <Sri Lanka>
`;

export function IndiaMapAscii() {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [mode, setMode] = useState<'raster' | 'ascii'>('raster');

  return (
    <div className="relative w-full max-w-[500px] select-none rounded-lg border border-border bg-card/60 p-4 font-mono text-xs shadow-sm">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground uppercase tracking-widest">
            GEO_MATRIX // BHARAT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode(mode === 'raster' ? 'ascii' : 'raster')}
            className="rounded border border-border bg-background px-2 py-0.5 text-[10px] uppercase hover:bg-muted text-foreground transition-colors"
          >
            {mode === 'raster' ? 'ASCII_MODE' : 'RASTER_MODE'}
          </button>
          <span className="text-[10px] hidden sm:inline">20.59°N 78.96°E</span>
        </div>
      </div>

      {mode === 'raster' ? (
        <div className="relative my-4 flex flex-col justify-center space-y-[3.5px] py-2">
          {INDIA_SCANLINES.map((slice, idx) => {
            const isHovered = hoveredSlice === slice.label;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredSlice(slice.label)}
                onMouseLeave={() => setHoveredSlice(null)}
                className="group flex items-center gap-2 text-[10px] cursor-crosshair"
              >
                {/* Lat marker */}
                <span className="w-8 shrink-0 text-right text-[9px] text-muted-foreground/60 group-hover:text-foreground">
                  {idx % 4 === 0 ? slice.lat : ''}
                </span>

                {/* Scanline graphic */}
                <div className="relative flex-1 h-[6px] overflow-hidden">
                  <div
                    style={{
                      marginLeft: `${slice.offset}%`,
                      width: `${slice.width}%`,
                    }}
                    className={`h-[4px] rounded-[1px] transition-all duration-150 relative ${
                      slice.isWB
                        ? 'bg-foreground group-hover:bg-primary shadow-[0_0_8px_rgba(0,0,0,0.3)]'
                        : 'bg-foreground/85 group-hover:bg-foreground'
                    }`}
                  >
                    {/* West Bengal active node marker */}
                    {slice.isWB && (
                      <span className="absolute -right-1.5 -top-1 h-3 w-1.5 bg-black dark:bg-white rounded-full animate-ping opacity-75" />
                    )}
                  </div>

                  {/* Raster line trailing hash */}
                  <div
                    style={{
                      left: `calc(${slice.offset}% + ${slice.width}%)`,
                    }}
                    className="absolute top-0 h-[1px] w-full border-b border-dashed border-border/40"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <pre className="my-2 overflow-x-auto text-[10px] leading-tight text-foreground font-mono bg-muted/20 p-2 rounded">
          {ASCII_ART_INDIA}
        </pre>
      )}

      {/* Dynamic Status Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-border/70 pt-2 text-[10px] text-muted-foreground">
        <div>
          <span>REGION: </span>
          <strong className="text-foreground">
            {hoveredSlice ?? '28 STATES & 8 UTs (ACTIVE)'}
          </strong>
        </div>
        <div className="flex items-center gap-1.5 text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-black dark:bg-white" />
          <span className="font-medium text-[10px]">WB PILOT: 6 SCHEMES</span>
        </div>
      </div>
    </div>
  );
}
