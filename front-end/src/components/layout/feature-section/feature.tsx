"use client";
import React from "react";
import Image from "next/image";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare, Users, CheckCircle2, ArrowRight } from "lucide-react";

// Use the nurse image from the signup-sc folder as the background for this section.
// Place alternative images under `public/signup-sc/` and update this path if needed.
const SIGNUP_DESKTOP_IMAGE = "/signup-sc/nurse.png";
const SIGNUP_MOBILE_IMAGE = "/signup-sc/nurse-mobile.png";

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
    <section className="relative z-20 overflow-hidden border-t border-slate-100 bg-white py-8 md:py-20 min-h-[320px] md:min-h-[520px] mt-8 md:mt-12">
      {/* Mobile-only right-side background */}
      <div className="absolute right-0 top-24 md:hidden -z-10 w-5/6 h-full overflow-hidden">
        <Image
          src={SIGNUP_MOBILE_IMAGE}
          alt="Find your purpose in America's healthcare community"
          fill
          className="object-contain object-right"
          sizes="50vw"
          priority
        />
      </div>

      {/* Desktop-only right-side nurse background */}
      <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 -z-10 w-1/2 h-[520px] lg:h-[560px] overflow-hidden rounded-[2rem]">
        <Image
          src={SIGNUP_DESKTOP_IMAGE}
          alt="Find your purpose in America's healthcare community"
          fill
          className="object-cover object-right"
          sizes="50vw"
          priority
        />
      </div>

      {/* Subtle overlay to keep text readable on small screens */}
      <div className="absolute inset-0 -z-20 bg-white/80 md:bg-transparent" />
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

        {/* RIGHT IMAGE SECTION removed per request */}

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