import Link from "next/link";
import { ChevronRight, MapPin, Mail, ShieldCheck, Building2, ArrowUpRight } from "lucide-react";
import { htmlToPlainText } from "@/lib/html-to-plain-text";

export type CompanyCardProps = {
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  locations?: { name: string }[];
  /** Public API uses `null` when no email is set. */
  contactEmail?: string | null;
};

const PlaceholderLogo = ({ letter }: { letter: string }) => (
  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-xl font-semibold text-slate-400">
    {letter}
  </div>
);

export function CompanyCard({
  slug,
  name,
  description,
  logoUrl,
  locations,
  contactEmail
}: CompanyCardProps) {
  const letter = name.trim().slice(0, 1).toUpperCase() || "?";
  const preview = htmlToPlainText(description);
  const primaryLocation = locations?.[0]?.name || "Multiple Locations";

  return (
    <div className="group relative flex flex-col h-full bg-white border border-slate-200 rounded-xl transition-all duration-300 hover:border-blue-300 hover:shadow-md overflow-hidden">
      
      {/* Top Accent Bar - Subtle Healthcare Blue */}
      <div className="h-1.5 w-full bg-slate-100 group-hover:bg-red-400 transition-colors duration-300" />

      <div className="flex flex-col p-5 h-full">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className="h-full w-full object-contain"
              />
            ) : (
              <PlaceholderLogo letter={letter} />
            )}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-[10px] font-semibold text-red-600 uppercase tracking-wider border border-blue-100/50">
            <ShieldCheck className="w-3 h-3" />
            Verified
          </div>
        </div>

        {/* Title & Category */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 line-clamp-1 group-hover:text-red-700 transition-colors">
            {name}
          </h2>
          <div className="flex items-center gap-1.5 mt-1 text-slate-500">
            <Building2 className="w-3 h-3" />
            <span className="text-[11px] font-medium uppercase tracking-tight">Healthcare Institution</span>
          </div>
        </div>

        {/* Description - More Distilled */}
        <div className="flex-1">
          {preview ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
              {preview}
            </p>
          ) : (
            <p className="text-sm italic text-slate-400">Professional healthcare provider details...</p>
          )}
        </div>

        {/* Metadata - Compact & Clean */}
        <div className="mt-5 pt-4 border-t border-slate-50 space-y-2">
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium truncate">{primaryLocation}</span>
          </div>

          {contactEmail && (
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium truncate">{contactEmail}</span>
            </div>
          )}
        </div>

        {/* Minimalist Professional Action */}
        <div className="mt-5">
          <Link
            href={`/companies/${slug}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-600 text-white text-xs font-semibold transition-all hover:bg-red-800 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
          >
            View Career Portal
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}