// components/profile/image-cropper-modal.tsx
"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { X, ZoomIn, Scissors } from "lucide-react";

interface ImageCropperModalProps {
  image: string;
  aspect: number;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  title?: string;
}

export function ImageCropperModal({ image, aspect, onClose, onCropComplete, title }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteInternal = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createCroppedImage = async () => {
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      img.src = image;
      await new Promise((resolve) => (img.onload = resolve));

      if (!croppedAreaPixels) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");

      ctx?.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob);
      }, "image/jpeg", 0.9);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">{title || "Adjust Image"}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="relative h-80 w-full bg-red-600 sm:h-96">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="space-y-6 p-8">
          <div className="flex items-center gap-4">
            <ZoomIn size={18} className="text-slate-400" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-red-600"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={createCroppedImage}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-red-800"
            >
              <Scissors size={16} /> Apply Crop
            </button>
            <button onClick={onClose} className="rounded-2xl bg-slate-100 px-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}