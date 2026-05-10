import React from 'react'

export default function FullScreenLoader({ label = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-900/70">
      {/* Spinner */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-solid border-red-600 border-t-transparent"></div>
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dotted border-blue-400 opacity-30"></div>
      </div>
      
      {/* Label */}
      {label && (
        <p className="mt-4 text-sm font-medium tracking-widest text-slate-800 dark:text-slate-200 uppercase">
          {label}
        </p>
      )}
    </div>
  )
}