"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";

import type { JobMapMarker } from "@/lib/api/public-api";
import { US_STATES, US_STATE_CENTER, type UsStateRecord } from "@/lib/us-states";

// Fix default markers in leaflet (legacy Leaflet icon paths)
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type JobsMapProps = {
  mapMarkers: JobMapMarker[];
  selectedState?: string;
  onStateSelect: (code: string) => void;
  className?: string;
};

export function JobsMapInner({
  mapMarkers,
  selectedState,
  onStateSelect,
  className = "",
}: JobsMapProps) {
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mapMarkers.forEach((m) => {
      const code = (m.stateCode ?? "").trim().toUpperCase();
      if (code) counts[code] = (counts[code] ?? 0) + 1;
    });
    return counts;
  }, [mapMarkers]);

  return (
    <div
      className={`h-[400px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-lg lg:h-[500px] ${className}`}
    >
      <MapContainer
        center={[37.8, -96]}
        zoom={4}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {US_STATES.map((state: UsStateRecord) => {
          const center = US_STATE_CENTER[state.code as keyof typeof US_STATE_CENTER];
          if (!center) return null;
          const count = stateCounts[state.code] ?? 0;
          const isSelected = selectedState === state.code;
          const radius = Math.max(8, Math.sqrt(count) * 3 + (isSelected ? 8 : 0));
          const fillOpacity = isSelected ? 0.8 : 0.6;

          return (
            <CircleMarker
              key={state.code}
              center={center as [number, number]}
              radius={radius}
              fillColor={isSelected ? "#ef4444" : "#f87171"}
              color="#dc2626"
              weight={isSelected ? 3 : 2}
              opacity={0.9}
              fillOpacity={fillOpacity}
              interactive={true}
              eventHandlers={{
                click: () => onStateSelect(state.code),
              }}
            >
              <Tooltip permanent={false} direction="top">
                <div className="p-2 text-xs">
                  <div className="font-bold text-red-700">{state.name}</div>
                  <div>{count} jobs</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
