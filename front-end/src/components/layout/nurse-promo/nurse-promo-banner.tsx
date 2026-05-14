"use client";
import React, { useState } from "react";
import Image from "next/image";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const NURSE_APPRECIATION_IMAGE = `/signup-sc/${encodeURIComponent("nurse website.avif")}`;

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
              <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-[#f4f4f4] shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-red-600/5 group">
                <div className="flex flex-col items-center md:flex-row">
                  <div className="w-full p-2 md:w-2/5 md:p-4">
                    <div className="relative h-64 w-full overflow-hidden rounded-2xl shadow-inner md:h-80">
                      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-red-600/20 to-transparent" />
                      <Image
                        src={NURSE_APPRECIATION_IMAGE}
                        alt="Nurse Appreciation Month — live sessions for nurses"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 40vw"
                      />
                      <div className="absolute bottom-4 left-4 z-20 rounded-full border border-red-100 bg-white/90 px-3 py-1 backdrop-blur-sm">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                          May 2026
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full p-6 md:w-3/5 md:p-10 md:pl-2">
                    <motion.h2
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-4 text-2xl font-bold leading-tight text-gray-900 md:text-4xl"
                    >
                      Nurse Appreciation Month{" "}
                      <span className="text-red-600 underline decoration-red-200 decoration-4 underline-offset-4">
                        Live sessions
                      </span>
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mb-8 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base"
                    >
                      Join us this May for fresh workshops on resilience, charting smarter (not
                      harder), and negotiating your next offer—built for RNs, LPN/LVNs, CNAs, and
                      students entering the field. Free to attend; spots are limited each week.
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <a
                        href="/register"
                        className="group inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-red-600 transition-colors hover:text-red-700"
                      >
                        Save your seat
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          <ArrowRight
                            size={20}
                            className="transition-transform group-hover:translate-x-1"
                          />
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
