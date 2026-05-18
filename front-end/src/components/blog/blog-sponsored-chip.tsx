type BlogSponsoredChipProps = {
  className?: string;
};

/** Small disclosure label for paid / partner blog posts (editorial + list cards). */
export function BlogSponsoredChip({ className = "" }: BlogSponsoredChipProps) {
  return (
    <span
      role="note"
      aria-label="Sponsored content"
      className={`inline-block shrink-0 border border-red-600 bg-red-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white ${className}`}
    >
      Sponsored
    </span>
  );
}
