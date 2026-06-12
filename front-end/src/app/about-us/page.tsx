import { Metadata } from "next";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";

export const metadata: Metadata = {
  title: "About Us | America Needs Nurses",
  description: "About America Needs Nurses - Connecting Nurses with Opportunity Across America",
};

export default function AboutUsPage() {
  return (
    <div className="bg-slate-50 py-16 min-h-screen">
      <SiteContentWrapper>
        <div className="mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">About Us – America Needs Nurses</h1>
          <p className="text-slate-500 mb-8 font-medium text-lg">Connecting Nurses with Opportunity Across America</p>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
            <p>At America Needs Nurses, we believe that every nurse deserves access to meaningful career opportunities, professional growth, and a supportive healthcare community.</p>
            <p>Our platform was created to bridge the gap between qualified nursing professionals and healthcare organizations seeking exceptional talent. We help nurses discover new opportunities while enabling employers to connect directly with skilled candidates across the United States. America Needs Nurses was founded by Ray Washington with a mission to create greater visibility and opportunity for healthcare professionals nationwide.</p>
            <p>Whether you are a Registered Nurse (RN), Licensed Practical Nurse (LPN/LVN), Certified Nursing Assistant (CNA), Nurse Practitioner (NP), Physician Assistant (PA), or healthcare employer, our platform is designed to make hiring, networking, and career advancement easier and more effective.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Our Mission</h2>
            <p>To empower nurses and healthcare organizations by creating a trusted platform where talent, opportunity, education, and community come together.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">What We Offer</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nursing job opportunities across the United States</li>
              <li>Direct connections between nurses and employers</li>
              <li>Professional networking and community engagement</li>
              <li>Career resources, industry insights, and educational content</li>
              <li>Credential verification support</li>
              <li>Flexible employment opportunities including permanent, travel, and per-diem positions</li>
              <li>Employer branding and recruitment solutions</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Why Nurses Choose Us</h2>
            <p>Healthcare professionals face increasing challenges when searching for the right opportunities. We simplify that process by providing:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access to verified employers</li>
              <li>Specialized nursing job listings</li>
              <li>Faster communication with hiring organizations</li>
              <li>Career development resources</li>
              <li>Professional community support</li>
              <li>Nationwide opportunities across multiple specialties</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Why Employers Choose Us</h2>
            <p>Healthcare facilities rely on qualified and dedicated nursing professionals. Our platform helps employers:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Reach highly targeted nursing audiences</li>
              <li>Post and manage job opportunities efficiently</li>
              <li>Review qualified applicants</li>
              <li>Connect directly with healthcare talent</li>
              <li>Build long-term workforce pipelines</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Our Vision</h2>
            <p>We envision a future where every healthcare organization can find the talent they need and every nurse can access the opportunities they deserve.</p>
            <p>By combining technology, community, education, and recruitment solutions, America Needs Nurses is helping shape a stronger healthcare workforce for the future.</p>
          </div>
        </div>
      </SiteContentWrapper>
    </div>
  );
}
