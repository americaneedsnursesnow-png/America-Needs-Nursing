"use client";
import React, { useState } from 'react';
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import Image from 'next/image';

const NursePromoBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="mb-10 bg-white">
    <SiteContentWrapper>
    <AnimatePresence>
      {isVisible && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full p-4 md:p-8"
        >
          <div className="relative bg-[#f4f4f4] rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group transition-all duration-300 hover:shadow-xl hover:shadow-red-600/5">
            
            {/* Close Button */}
           

            <div className="flex flex-col md:flex-row items-center">
              
              {/* Image Section */}
              <div className="w-full md:w-2/5 p-2 md:p-4">
                <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-inner">
                  {/* Replace with your actual image path */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 to-transparent z-10" />
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop" 
                    alt="Nurses Event"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Floating Badge (Extra Modern Touch) */}
                  <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-red-100">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Annual Event</p>
                  </div>
                </div>
              </div>

              {/* Text Content Section */}
              <div className="w-full md:w-3/5 p-6 md:p-10 md:pl-2">
                <motion.h2 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl md:text-4xl font-bold text-gray-900 leading-tight mb-4"
                >
                  National Nurses Week <br />
                  <span className="text-red-600 underline decoration-red-200 decoration-4 underline-offset-4">
                    Virtual Event
                  </span>
                </motion.h2>

                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-gray-600 text-sm md:text-base leading-relaxed mb-8 max-w-xl"
                >
                  Celebrate National Nurses Week at our third annual virtual event, created just for you. 
                  Enjoy an inspiring experience with powerful stories, meaningful connections, and 
                  joyful moments that spotlight your voice and impact. Plus, don’t miss your chance 
                  to win our grand prize: a <span className="font-bold text-gray-900">$2,000 Visa gift card</span> and 
                  a catered lunch at your workplace!
                </motion.p>

                <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.4 }}
                >
                  <a 
                    href="/register" 
                    className="group inline-flex items-center gap-2 text-red-600 font-extrabold text-sm tracking-widest uppercase hover:text-red-700 transition-colors"
                  >
                    Register Today
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </motion.span>
                  </a>
                </motion.div>
              </div>

            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
    </SiteContentWrapper>
    </div>
  );
};

export default NursePromoBanner;