import { Metadata } from "next";
import { SiteContentWrapper } from "@/components/layout/SiteContentWrapper";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for America Needs Nurses",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-slate-50 py-16 min-h-screen">
      <SiteContentWrapper>
        <div className="mx-auto max-w-4xl bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 mb-8 font-medium">America Needs Nurses (ANN)<br/>Effective Date: June 2026</p>

          <div className="prose prose-slate max-w-none text-slate-700 space-y-6">
            <p>Welcome to America Needs Nurses (“ANN,” “we,” “our,” or “us”). We are committed to protecting the privacy, security, and confidentiality of all healthcare professionals, employers, recruiters, students, visitors, and users who access or use our website, services, and related platforms available through americaneedsnurses.com.</p>
            <p>This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you interact with our platform. By accessing or using our website, you agree to the practices described in this Privacy Policy.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Information We Collect</h2>
            <p>We may collect personal information that you voluntarily provide, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Mailing address</li>
              <li>Professional credentials</li>
              <li>Nursing licenses and certifications</li>
              <li>Employment history</li>
              <li>Educational background</li>
              <li>Resume and CV information</li>
              <li>Profile photographs</li>
              <li>Company information</li>
              <li>Job posting details</li>
              <li>Payment information (where applicable)</li>
            </ul>

            <p className="mt-4">We may also automatically collect technical information such as:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device information</li>
              <li>Operating system</li>
              <li>Website activity</li>
              <li>Pages visited</li>
              <li>Referral sources</li>
              <li>Session duration</li>
              <li>Cookie data</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">How We Use Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Create and manage user accounts</li>
              <li>Connect healthcare professionals with employers</li>
              <li>Facilitate job applications and recruitment activities</li>
              <li>Improve platform functionality and user experience</li>
              <li>Provide customer support</li>
              <li>Send notifications and updates</li>
              <li>Deliver marketing communications</li>
              <li>Monitor website performance and security</li>
              <li>Prevent fraud and unauthorized activities</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Professional Profiles and Employment Information</h2>
            <p>Healthcare professionals may choose to create profiles containing professional information, qualifications, certifications, experience, and resumes. Information submitted may be viewed by employers, recruiters, staffing agencies, and healthcare organizations using the platform.</p>
            <p>Users are responsible for ensuring that all submitted information is accurate, current, and lawful.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Employer Accounts and Job Listings</h2>
            <p>Employers using the platform may provide business information, company descriptions, job postings, employment opportunities, and contact information.</p>
            <p>ANN may review content for quality, compliance, and platform standards but does not guarantee the accuracy or legitimacy of employer-submitted content.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Communications</h2>
            <p>By registering on our platform, users consent to receive:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account notifications</li>
              <li>Application updates</li>
              <li>Job alerts</li>
              <li>Platform announcements</li>
              <li>Marketing communications</li>
              <li>Educational content</li>
              <li>Event invitations</li>
            </ul>
            <p>Users may opt out of marketing communications at any time.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Cookies and Tracking Technologies</h2>
            <p>We may use cookies, analytics tools, pixels, and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Improve website performance</li>
              <li>Analyze user behavior</li>
              <li>Enhance security</li>
              <li>Personalize user experiences</li>
              <li>Measure advertising effectiveness</li>
            </ul>
            <p>Users may control cookie preferences through browser settings.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Information Sharing</h2>
            <p>We may share information with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Healthcare employers</li>
              <li>Recruitment agencies</li>
              <li>Staffing partners</li>
              <li>Technology service providers</li>
              <li>Marketing providers</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p>We do not sell personal information to third parties.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Data Security</h2>
            <p>We implement commercially reasonable security measures designed to protect information against unauthorized access, disclosure, alteration, or destruction.</p>
            <p>Despite our efforts, no internet-based platform can guarantee absolute security.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Data Retention</h2>
            <p>We retain information for as long as necessary to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide services</li>
              <li>Maintain platform operations</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce agreements</li>
            </ul>
            <p>We reserve the right to retain certain records where legally required.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Third-Party Services</h2>
            <p>The platform may contain links to third-party websites, applications, services, or resources. ANN is not responsible for the privacy practices, policies, or content of third-party services.</p>
            <p>Users should review applicable privacy policies before providing information to third parties.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">User Rights</h2>
            <p>Users may request to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access personal information</li>
              <li>Correct inaccurate information</li>
              <li>Update profile information</li>
              <li>Delete account information</li>
              <li>Withdraw marketing consent</li>
            </ul>
            <p>Requests may be submitted through our contact channels.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Children's Privacy</h2>
            <p>Our platform is intended for individuals who are at least 18 years of age. We do not knowingly collect personal information from children.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Changes to this Privacy Policy</h2>
            <p>We reserve the right to modify this Privacy Policy at any time. Updated versions will be posted on this page with a revised effective date.</p>
            <p>Continued use of the platform following updates constitutes acceptance of the revised policy.</p>

            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Contact Information</h2>
            <p>
              America Needs Nurses<br/>
              1141 Hawthorne Circle, Madison, GA, 30650, USA<br/>
              Email: <a href="mailto:admin@americaneedsnurses.com" className="text-red-600 hover:underline">admin@americaneedsnurses.com</a><br/>
              Website: americaneedsnurses.com
            </p>
          </div>
        </div>
      </SiteContentWrapper>
    </div>
  );
}
