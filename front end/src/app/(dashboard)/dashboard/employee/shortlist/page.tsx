"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, MessageSquare, Eye, Trash2, 
  Briefcase, Calendar, Search, ChevronLeft,
  UserCheck, ArrowUpRight
} from 'lucide-react';

const ShortlistPage = () => {
  // Mock data for shortlisted candidates
  const [shortlisted, setShortlisted] = useState([
    { 
      id: 1, 
      name: "Dianne Russell", 
      role: "Frontend Developer", 
      appliedFor: "Senior React Engineer", 
      jobId: 101,
      date: "24 Oct, 2023",
      avatar: "DR",
      color: "bg-blue-100 text-blue-600"
    },
    { 
      id: 2, 
      name: "Guy Hawkins", 
      role: "UI/UX Designer", 
      appliedFor: "Product Designer", 
      jobId: 102,
      date: "22 Oct, 2023",
      avatar: "GH",
      color: "bg-purple-100 text-purple-600"
    },
    { 
      id: 3, 
      name: "Kristin Watson", 
      role: "Backend Developer", 
      appliedFor: "Node.js Expert", 
      jobId: 105,
      date: "20 Oct, 2023",
      avatar: "KW",
      color: "bg-orange-100 text-orange-600"
    },
  ]);

  return (
    <div className="p-10 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-2">
            <Link href="/dashboard/employee" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-red-600 transition-colors mb-4">
                <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
                Shortlisted <span className="bg-red-50 text-red-600 px-4 py-1 rounded-2xl text-xl">{shortlisted.length}</span>
            </h1>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search candidates..." 
                    className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl w-[300px] focus:ring-2 focus:ring-red-500/10 outline-none transition-all font-medium"
                />
            </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 text-[11px] uppercase font-black text-gray-400 tracking-widest">
                    <tr>
                        <th className="px-8 py-6">Candidate</th>
                        <th className="px-8 py-6">Job Reference</th>
                        <th className="px-8 py-6">Added Date</th>
                        <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {shortlisted.map((candidate) => (
                        <tr key={candidate.id} className="hover:bg-gray-50/30 transition-all group">
                            {/* Candidate Info */}
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${candidate.color}`}>
                                        {candidate.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-gray-900 group-hover:text-red-600 transition-colors">
                                            {candidate.name}
                                        </h3>
                                        <p className="text-sm text-gray-400 font-medium">{candidate.role}</p>
                                    </div>
                                </div>
                            </td>

                            {/* Job Reference Section */}
                            <td className="px-8 py-6">
                                <Link 
                                    href={`/dashboard/employee/jobs/${candidate.jobId}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl hover:bg-red-500 hover:text-white transition-all group/job"
                                >
                                    <Briefcase size={14} className="text-gray-800 group-hover/job:text-slate-900" />
                                    <span className="text-sm font-bold">{candidate.appliedFor}</span>
                                    <ArrowUpRight size={14} className="opacity-0 group-hover/job:opacity-100 transition-opacity" />
                                </Link>
                            </td>

                            {/* Date Section */}
                            <td className="px-8 py-6">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                                    <Calendar size={14} />
                                    {candidate.date}
                                </div>
                            </td>

                            {/* Actions Section */}
                            <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-3">
                                    {/* View Profile */}
                                    

                                    {/* Message Option */}
                                    <button className="flex items-center gap-2 px-5 py-3  text-red-500 rounded-xl hover:text-white hover:bg-red-600 transition-all font-bold text-sm">
                                        <MessageSquare size={16} />
                                        <Link href=".">
                                        <span>Message</span>
                                        </Link>
                                    </button>

                                    {/* Un-Shortlist (Remove) */}
                                    <button className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {shortlisted.length === 0 && (
                <div className="p-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserCheck size={40} className="text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900">No candidates shortlisted yet</h3>
                    <p className="text-gray-400 mt-2 font-medium">When you shortlist applicants, they will appear here.</p>
                </div>
            )}
        </div>
      </div>

      {/* Helper Footer */}
      <div className="mt-8 flex items-center gap-4 p-6 bg-red-50/50 rounded-[24px] border border-red-100/50">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white">
            <Heart size={20} fill="currentColor" />
        </div>
        <div>
            <p className="text-sm font-black text-red-900">Shortlisting Pro-Tip</p>
            <p className="text-xs text-red-700 font-medium leading-relaxed">Shortlisted candidates are 40% more likely to respond to messages. Keep your pipeline warm!</p>
        </div>
      </div>
    </div>
  );
};

export default ShortlistPage;