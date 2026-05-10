"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Eye, 
  EyeOff, 
  Lock, 
  ChevronLeft, 
  ShieldAlert, 
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirm) return;

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log("Deleting account...");
      setIsLoading(false);
      // alert("Account deletion request processed.");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-4 py-8 md:px-8 lg:px-12">
      <div className=" min-w-6xl max-full-w">
        
        {/* Back Button */}
        

        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-4xl">
            Delete Account
          </h1>
          <p className="mt-3 text-lg font-medium text-gray-500 leading-relaxed">
            We’re sorry to see you go. Deleting your account is permanent and will remove all your data from our platform.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/20">
          
          {/* Warning Banner */}
          <div className="bg-red-50/50 p-8 md:p-10 border-b border-red-50">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">This is a permanent action</h2>
                <p className="mt-2 text-sm font-medium text-gray-600 leading-relaxed">
                  Once the process is complete, the following data will be permanently removed and cannot be recovered:
                </p>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Profile & Personal Info',
                    'Application History',
                    'Messaging Logs',
                    'Active Job Listings'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-red-700/70">
                      <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleDelete} className="p-8 md:p-10 space-y-8">
            
            {/* Password Input */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Confirm your password
              </label>
              <div className="relative group max-w-md">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-red-600 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-12 text-sm font-medium transition-all focus:border-red-600 focus:outline-none focus:ring-4 focus:ring-red-500/5 placeholder:text-gray-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-red-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirmation Toggle Card */}
            <div 
              onClick={() => setIsConfirm(!isConfirm)}
              className={`group cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                isConfirm 
                ? 'border-red-600 bg-red-50/30' 
                : 'border-gray-100 bg-gray-50/50 hover:border-red-100'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                  isConfirm ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300 group-hover:border-red-400'
                }`}>
                  {isConfirm && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    I confirm that I want to delete my account
                  </p>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    I understand that all my data will be wiped and this action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={!password || !isConfirm || isLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-bold transition-all sm:w-auto min-w-[220px] ${
                  password && isConfirm && !isLoading
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Permanently Delete
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full rounded-2xl px-8 py-4 text-sm font-bold text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 sm:w-auto"
              >
                Cancel & Stay
              </button>
            </div>
          </form>
        </div>

        
      </div>
    </div>
  );
}