"use client";
import React from 'react';
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MessageSquare, Users, Briefcase, BookOpen, CheckCircle2, ArrowRight } from 'lucide-react';

const AmericaNeedNursingSection = () => {
  const sentence = "Find your purpose in America's healthcare community.";
  
  // Variants for staggered entrance
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="relative z-20 overflow-hidden border-t border-slate-100 bg-white py-12 md:py-20 ">
      <SiteContentWrapper>
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
        
        {/* LEFT CONTENT - Compact Spacing */}
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col space-y-5"
        >
          <motion.span variants={item} className="text-red-600 font-bold tracking-widest uppercase text-xs">
            Connect • Hire • Grow
          </motion.span>

          <motion.h1 variants={item} className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            {sentence.split(" ").map((word, i) => (
              <motion.span 
                key={i} 
                initial={{ opacity: 0 }} 
                whileInView={{ opacity: 1 }} 
                transition={{ delay: i * 0.1 }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p variants={item} className="text-base text-slate-600 leading-relaxed max-w-lg">
            America Need Nursing is the #1 platform where companies chat directly with nurses. 
            Join our community to discuss jobs, read expert blogs, and get hired faster.
          </motion.p>

          {/* Compact Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <MiniFeature 
              icon={<Users size={18} />} 
              title="Nurse Community" 
              desc="Chat with peers nationwide." 
            />
            <MiniFeature 
              icon={<MessageSquare size={18} />} 
              title="Direct Hiring" 
              desc="Chat with shortlisted nurses." 
            />
          </div>

          <motion.div variants={item} className="pt-4 flex flex-wrap gap-4">
           <Link href="/jobs">
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all  active:scale-95 flex items-center gap-2">
              Browse Jobs
              <ArrowRight size={18} />
            </button>
            </Link>
            <Link href="/blog">
              <button className="border border-slate-200 hover:bg-slate-50 text-slate-700 px-8 py-3 rounded-xl font-bold transition-all">
                Read Blogs
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* RIGHT IMAGE SECTION - Improved & Height Controlled */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex justify-center lg:justify-end"
        >
          {/* Main Image Container with fixed max height */}
          <div className="relative w-full max-w-[420px] h-[480px] group">
            
            {/* Decorative Background Element */}
            <div className="absolute -bottom-4 -left-4 w-full h-full  rounded-[2.5rem] -z-10 transition-transform group-hover:-rotate-3 group-hover:scale-105 duration-500" />
            
            {/* Main Image Frame */}
            <div className="w-full h-full bg-slate-500 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white relative">
              <img 
                src="https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?q=80&w=1983&auto=format&fit=crop" 
                alt="Nurse Professional"
                className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Floating "Online Chat" Card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-6 -right-1 bg-white p-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white ring-4 ring-green-50">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Nurse Chat</p>
                  <p className="text-xs font-bold text-slate-800">1.2k Online</p>
                </div>
              </motion.div>

              {/* Verified Badge */}
              <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                <CheckCircle2 className="text-red-600" size={16} />
                <span className="text-xs font-bold text-slate-900">Verified Platform</span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
      </SiteContentWrapper>
    </section>
  );
};

// Compact Feature Sub-component
const MiniFeature = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
    <div className="text-red-600 bg-red-50 p-2 rounded-lg h-fit group-hover:bg-red-600 group-hover:text-white transition-colors">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      <p className="text-slate-500 text-[11px] leading-tight">{desc}</p>
    </div>
  </div>
);

export default AmericaNeedNursingSection;