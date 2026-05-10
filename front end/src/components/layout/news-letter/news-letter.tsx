"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Briefcase, MessageSquare, Bell, ChevronRight, Users, CheckCircle2 } from 'lucide-react';
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import SubscribeForm from './Subscribe-form';

const NewsletterSection = () => {
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, staggerChildren: 0.1 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <section className="w-full py-10 md:py-14 bg-gray-50">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
        className="w-full"
      >
        <SiteContentWrapper>
        <div className="relative overflow-hidden bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 grid lg:grid-cols-5">
          
          {/* Decorative Background Element */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-red-50 rounded-full -translate-x-16 -translate-y-16 blur-3xl opacity-50" />

          {/* Left Side: Content - Reduced padding from p-14 to p-8/10 */}
          <div className="lg:col-span-3 p-6 md:p-8 lg:p-10 flex flex-col justify-center relative z-10">
            <motion.div variants={itemVariants} className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-full">
                Newsletter
              </span>
              <span className="text-gray-400 text-[10px] font-medium uppercase tracking-widest">
                Subscribe to our newsletter
              </span>
            </motion.div>
            
            <motion.h2 variants={itemVariants} className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-[1.1] mb-3">
              Get Connected. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">
                Stay Informed.
              </span>
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-slate-500 text-sm md:text-base max-w-lg mb-6 leading-relaxed">
              Join America&apos;s leading network for nurses. Get exclusive jobs and community updates delivered to your inbox.
            </motion.p>

            <motion.div variants={itemVariants} className="w-full max-w-md">
              <SubscribeForm />
              <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" /> No spam, just high-quality nursing career insights.
              </p>
            </motion.div>
          </div>

          {/* Right Side: Features (Red Side) - Reduced padding */}
          <div className="lg:col-span-2 bg-gradient-to-br from-red-600 to-red-700 p-6 md:p-8 flex flex-col relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -mr-32 -mt-32" />
            </div>

            {/* Header - Reduced margin */}
            <motion.div variants={itemVariants} className="relative z-10 mb-4">
              <h3 className="text-white text-lg font-bold">Premium Benefits</h3>
              <div className="h-0.5 w-10 bg-white/30 rounded-full mt-1" />
            </motion.div>

            <div className="flex flex-col relative z-10">
              {[
                {
                  icon: Briefcase,
                  title: "Weekly Job Alerts",
                  desc: "Direct access to exclusive nursing vacancies."
                },
                {
                  icon: MessageSquare,
                  title: "Community Chat",
                  desc: "Engage with healthcare experts and share experiences."
                },
                {
                  icon: Bell,
                  title: "Instant Updates",
                  desc: "Know when top companies shortlist your profile."
                }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  // Reduced padding from py-6 to py-3.5
                  className={`flex items-start gap-3 group cursor-default py-3.5 ${
                    idx !== 2 ? "border-b border-white/10" : ""
                  }`}
                >
                  <div className="bg-white/15 p-2 rounded-lg backdrop-blur-sm group-hover:bg-white transition-all duration-300 shrink-0">
                    <feature.icon className="w-5 h-5 text-white group-hover:text-red-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                      {feature.title}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-red-50/80 text-xs leading-snug">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer - Reduced margin */}
            <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-red-600 bg-red-400 flex items-center justify-center text-[8px] text-white font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-white/70 text-[10px] font-medium">
                Joined by <span className="text-white font-bold">10,000+</span> pros
              </p>
            </motion.div>
          </div>
        </div>
        </SiteContentWrapper>
      </motion.div>
    </section>
  );
};

export default NewsletterSection;