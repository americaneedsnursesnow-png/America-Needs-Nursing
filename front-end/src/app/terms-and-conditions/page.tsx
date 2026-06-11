import { Metadata } from "next";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for America Needs Nurses",
};

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-slate-50 py-16 min-h-screen">
      <SiteContentWrapper>
        <div className="mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
          <p className="text-slate-500 mb-8 font-medium">America Needs Nurses (ANN)<br/>Effective Date: June 2026</p>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
            <p>These Terms and Conditions govern your access to and use of America Needs Nurses (“ANN”), including all services, content, features, communications, applications, and resources available through americaneedsnurses.com.</p>
            <p>By accessing or using the platform, you acknowledge that you have read, understood, and agree to be legally bound by these Terms.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Platform Purpose</h2>
            <p>America Needs Nurses operates as a healthcare recruitment, networking, employer branding, career development, and professional engagement platform designed to connect healthcare professionals and employers.</p>
            <p>The platform may include:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Job listings</li>
              <li>Employer profiles</li>
              <li>Professional profiles</li>
              <li>Community features</li>
              <li>Educational content</li>
              <li>Recruitment services</li>
              <li>Marketing opportunities</li>
              <li>Career resources</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">User Eligibility</h2>
            <p>Users must be at least 18 years old and legally capable of entering binding agreements.</p>
            <p>By using the platform, you represent that all information provided is accurate and truthful.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">User Accounts</h2>
            <p>Users may be required to create an account to access certain features.</p>
            <p>Users are responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintaining account confidentiality</li>
              <li>Protecting login credentials</li>
              <li>All activities occurring under their accounts</li>
              <li>Updating account information when necessary</li>
            </ul>
            <p>ANN reserves the right to suspend or terminate accounts that violate these Terms.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Healthcare Professional Accounts</h2>
            <p>Healthcare professionals may create profiles and submit:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Employment history</li>
              <li>Certifications</li>
              <li>Licenses</li>
              <li>Educational records</li>
              <li>Professional experience</li>
              <li>Resume information</li>
            </ul>
            <p>Users are solely responsible for the accuracy of submitted information.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Employer Accounts</h2>
            <p>Employers may post jobs, create company profiles, and communicate with candidates.</p>
            <p>Employers agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Post misleading opportunities</li>
              <li>Misrepresent hiring requirements</li>
              <li>Violate employment laws</li>
              <li>Engage in discriminatory practices</li>
            </ul>
            <p>ANN reserves the right to remove content that violates platform standards.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Job Listings and Recruitment Activities</h2>
            <p>ANN provides a platform for employers and candidates to connect.</p>
            <p>ANN does not guarantee:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Employment opportunities</li>
              <li>Interview requests</li>
              <li>Candidate availability</li>
              <li>Hiring decisions</li>
              <li>Recruitment outcomes</li>
              <li>Business results</li>
            </ul>
            <p>Employment decisions remain solely between employers and applicants.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">User Conduct</h2>
            <p>Users agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Submit false information</li>
              <li>Impersonate individuals or organizations</li>
              <li>Harass other users</li>
              <li>Upload harmful software</li>
              <li>Violate laws or regulations</li>
              <li>Interfere with platform operations</li>
              <li>Attempt unauthorized access to systems</li>
              <li>Collect user information without consent</li>
            </ul>
            <p>Violations may result in account suspension or termination.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Intellectual Property</h2>
            <p>All website content including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Logos</li>
              <li>Graphics</li>
              <li>Branding</li>
              <li>Designs</li>
              <li>Text</li>
              <li>Videos</li>
              <li>Software</li>
              <li>Databases</li>
            </ul>
            <p>remain the property of America Needs Nurses or its licensors.</p>
            <p>No content may be copied, reproduced, distributed, or used without written authorization.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">User Content</h2>
            <p>Users retain ownership of content they submit to the platform.</p>
            <p>By submitting content, users grant ANN a non-exclusive, worldwide, royalty-free license to display, distribute, and use such content for platform operations and promotional purposes.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Third-Party Services</h2>
            <p>The platform may contain links to third-party websites and services.</p>
            <p>ANN does not endorse or guarantee third-party products, services, or content.</p>
            <p>Users access third-party services at their own risk.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Disclaimer of Warranties</h2>
            <p>The platform is provided on an “AS IS” and “AS AVAILABLE” basis.</p>
            <p>ANN makes no warranties regarding:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service availability</li>
              <li>Platform performance</li>
              <li>Job placement success</li>
              <li>Accuracy of listings</li>
              <li>Reliability of third-party content</li>
            </ul>
            <p>Use of the platform is at the user's own risk.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, ANN shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use of the platform</li>
              <li>Recruitment activities</li>
              <li>Employment decisions</li>
              <li>Data loss</li>
              <li>Service interruptions</li>
              <li>Third-party actions</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Indemnification</h2>
            <p>Users agree to indemnify and hold harmless America Needs Nurses, its officers, employees, contractors, affiliates, and partners from claims, damages, liabilities, and expenses resulting from misuse of the platform or violation of these Terms.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Termination</h2>
            <p>ANN reserves the right to suspend, restrict, or terminate access to any account or service at its sole discretion.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Modifications</h2>
            <p>We reserve the right to modify these Terms at any time.</p>
            <p>Continued use of the platform after changes become effective constitutes acceptance of the revised Terms.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Governing Law</h2>
            <p>These Terms shall be governed and interpreted in accordance with applicable laws and regulations.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Contact Information</h2>
            <p>America Needs Nurses<br/>Website: americaneedsnurses.com</p>
          </div>
        </div>
      </SiteContentWrapper>
    </div>
  );
}
