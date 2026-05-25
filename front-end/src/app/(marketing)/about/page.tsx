const companyBenefits = [
  "Reach targeted healthcare audiences",
  "Promote their employer brand",
  "Increase recruitment visibility",
  "Reduce dependence on expensive staffing solutions",
  "Highlight workplace culture and career growth opportunities",
  "Connect with nurses through trusted healthcare content and media exposure",
];

const nurseBenefits = [
  "Discover job opportunities across the country",
  "Stay informed about healthcare trends and news",
  "Connect with healthcare employers",
  "Explore educational and career advancement opportunities",
  "Join a growing healthcare community built around support and opportunity",
];

const platformFeatures = [
  "Healthcare job opportunities",
  "Employer branding and sponsored content",
  "Nurse-focused newsletters and media",
  "Recruitment marketing solutions",
  "Community engagement",
  "Strategic partnerships within healthcare",
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-100 bg-gradient-to-b from-red-50/70 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full bg-red-100 px-4 py-1.5 text-xs font-black uppercase tracking-[0.25em] text-red-700">
            About America Needs Nurses
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Connecting healthcare professionals with opportunity.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            At America Needs Nurses (ANN), our mission is simple: help solve
            America&apos;s healthcare staffing crisis by connecting healthcare
            professionals and healthcare organizations through trusted media,
            technology, and opportunity.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                Why We Exist
              </h2>
              <div className="mt-5 space-y-4 text-base leading-8 text-slate-600">
                <p>
                  We believe nurses and healthcare workers are the backbone of
                  healthcare. Yet too many professionals struggle to find the
                  right opportunities, while healthcare organizations face
                  ongoing staffing shortages, rising recruitment costs, burnout,
                  and retention challenges.
                </p>
                <p>
                  America Needs Nurses was created to bridge that gap with a
                  national healthcare network built around hiring, visibility,
                  trusted content, and community.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">
                What We Do
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                America Needs Nurses is a healthcare workforce platform designed
                to connect nurses and healthcare professionals with career
                opportunities, industry news, educational resources, and
                community. We also help hospitals, healthcare systems,
                long-term care facilities, staffing agencies, and healthcare
                brands reach a growing healthcare audience.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {platformFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-white bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2rem] bg-red-600 p-8 text-white shadow-xl shadow-red-100">
            <h2 className="text-2xl font-black tracking-tight">
              More Than A Job Board
            </h2>
            <p className="mt-5 text-base leading-8 text-red-50">
              We are building more than a job board. We are building a national
              healthcare network designed to support the future of healthcare
              hiring and workforce engagement.
            </p>
          </aside>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              How We Help Healthcare Companies
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Healthcare organizations need more than job postings. They need
              visibility, trust, and access to healthcare professionals actively
              looking for opportunities and industry connections.
            </p>
            <ul className="mt-6 space-y-3">
              {companyBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm font-semibold text-slate-700">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-600" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              How We Help Nurses
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              We believe healthcare professionals deserve better access to
              opportunities, resources, and support, from nursing students to
              experienced healthcare leaders.
            </p>
            <ul className="mt-6 space-y-3">
              {nurseBenefits.map((benefit) => (
                <li key={benefit} className="flex gap-3 text-sm font-semibold text-slate-700">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-600" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm sm:p-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">
            Our Vision
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            Our vision is to become one of the leading healthcare workforce
            platforms in America, helping healthcare organizations hire smarter
            while helping healthcare professionals build stronger careers.
            Healthcare is evolving, and so is the way organizations connect
            with talent. America Needs Nurses exists to help lead that
            transformation.
          </p>
        </div>
      </section>
    </main>
  );
}
