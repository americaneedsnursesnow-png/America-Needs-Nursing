import { Metadata } from "next";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";

export const metadata: Metadata = {
  title: "Contact Us | America Needs Nurses",
  description: "Get In Touch With America Needs Nurses",
};

export default function ContactUsPage() {
  return (
    <div className="bg-slate-50 py-16 min-h-screen">
      <SiteContentWrapper>
        <div className="mx-auto max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Contact Us</h1>
            <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
              Get In Touch With America Needs Nurses
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              
              {/* Information Column */}
              <div className="lg:col-span-5 bg-slate-900 p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 h-full flex flex-col">
                  <div className="mb-10">
                    <p className="text-slate-300 leading-relaxed mb-4">
                      We are here to help nurses, healthcare organizations, and industry professionals connect, grow, and succeed.
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Whether you are looking for nursing opportunities, hiring qualified professionals, or seeking support with your account, our team is ready to assist you.
                    </p>
                  </div>

                  <div className="space-y-8 flex-grow">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Contact Information
                      </h3>
                      <div className="space-y-2 text-slate-300">
                        <p><strong>America Needs Nurses</strong></p>
                        <p>United States</p>
                        <p className="flex items-center gap-2">
                           <a href="mailto:support@americaneedsnurses.com" className="hover:text-white transition-colors">support@americaneedsnurses.com</a>
                        </p>
                        <p className="flex items-center gap-2">
                           <a href="tel:+14047542651" className="hover:text-white transition-colors">+1 404-754-2651</a>
                        </p>
                        <p className="flex items-center gap-2">
                           <a href="https://americaneedsnurses.com" className="hover:text-white transition-colors">America Needs Nurses</a>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Support Hours
                      </h3>
                      <div className="text-slate-300">
                        <p>Monday – Friday</p>
                        <p className="font-medium text-white">9:00 AM – 6:00 PM (EST)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form & Extra Content Column */}
              <div className="lg:col-span-7 p-8 md:p-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Send Us a Message</h2>
                  <p className="text-slate-600">
                    Have a question, suggestion, or partnership inquiry? Complete our contact form and a member of our team will respond as soon as possible.
                  </p>
                </div>

                <form className="space-y-6 mb-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label htmlFor="firstName" className="ml-1 block text-sm font-semibold text-gray-700">First Name</label>
                      <input type="text" id="firstName" placeholder="John" className="form-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="lastName" className="ml-1 block text-sm font-semibold text-gray-700">Last Name</label>
                      <input type="text" id="lastName" placeholder="Doe" className="form-input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="ml-1 block text-sm font-semibold text-gray-700">Email Address</label>
                      <input type="email" id="email" placeholder="john@example.com" className="form-input" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="phone" className="ml-1 block text-sm font-semibold text-gray-700">Phone Number</label>
                      <input type="tel" id="phone" placeholder="+1 (555) 000-0000" className="form-input" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="ml-1 block text-sm font-semibold text-gray-700">Subject</label>
                    <select id="subject" className="form-input bg-white">
                      <option value="">Select a topic...</option>
                      <option value="nurse">I am a Nurse looking for opportunities</option>
                      <option value="employer">I am an Employer looking to hire</option>
                      <option value="support">Account Support</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="message" className="ml-1 block text-sm font-semibold text-gray-700">Message</label>
                    <textarea id="message" rows={4} placeholder="How can we help you?" className="form-input resize-y"></textarea>
                  </div>

                  <button
                    type="button"
                    className="group relative w-full overflow-hidden rounded-xl bg-button py-4 font-bold text-white shadow-lg shadow-button/20 transition-all hover:bg-button-dark active:scale-[0.98]"
                  >
                    SEND MESSAGE
                  </button>
                </form>

                {/* Additional Info Sections */}
                <div className="pt-8 border-t border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">How Can We Help?</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">N</div>
                        For Nurses
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-600 list-none">
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Create your professional profile</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Search nursing opportunities nationwide</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Connect with employers</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Access career resources and community discussions</li>
                        <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">•</span> Stay informed with industry updates</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">E</div>
                        For Employers
                      </h4>
                      <ul className="space-y-2 text-sm text-slate-600 list-none">
                        <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Post healthcare job openings</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Connect with qualified nursing professionals</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Build your employer brand</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Streamline recruitment efforts</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span> Access a growing healthcare talent network</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100 mt-8">
                    <p className="text-sm font-medium text-slate-600 italic">
                      We look forward to helping you build meaningful connections within the healthcare community.
                    </p>
                    <p className="mt-4 font-bold text-slate-900">America Needs Nurses</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Connecting Healthcare Professionals. Empowering Careers. Strengthening Communities.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </SiteContentWrapper>
    </div>
  );
}
