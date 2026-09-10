interface VisualProps {
  className?: string;
}

export function DashboardNextStepVisual({ className = 'h-8 w-8' }: VisualProps) {
  return <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <circle cx="24" cy="24" r="21" fill="currentColor" opacity="0.08" />
    <path d="M11 14.5C16 13.4 20 14.5 24 18V35C20 31.5 16 30.4 11 31.5V14.5Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M24 18C28 14.5 32 13.4 37 14.5V25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27.5 30H38M34 26L38 30L34 34" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16.5" cy="21" r="1.8" fill="currentColor" opacity="0.75" />
  </svg>;
}

export function DashboardRecommendationVisual({ kind, className = 'h-11 w-11' }: VisualProps & { kind: 'exercises' | 'courses' | 'roadmaps' }) {
  return <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
    <rect x="3.5" y="3.5" width="41" height="41" rx="10" fill="currentColor" opacity="0.08" />
    <rect x="3.5" y="3.5" width="41" height="41" rx="10" stroke="currentColor" opacity="0.22" />
    {kind === 'exercises' && <>
      <path d="M12 15H36V33H12V15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 21L21 24L17 27M24 28H31" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="18.5" r="1" fill="currentColor" /><circle cx="19.5" cy="18.5" r="1" fill="currentColor" opacity="0.55" />
    </>}
    {kind === 'courses' && <>
      <path d="M11.5 14.5C16.6 13.4 20.6 14.6 24 18V35C20.6 31.6 16.6 30.4 11.5 31.5V14.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M36.5 14.5C31.4 13.4 27.4 14.6 24 18V35C27.4 31.6 31.4 30.4 36.5 31.5V14.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 20H20M28 20H32M28 24H33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>}
    {kind === 'roadmaps' && <>
      <path d="M14 33C14 26 20 27 20 21C20 16 25 15 30 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
      <circle cx="14" cy="33" r="4" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="21" r="4" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="2" />
      <path d="M30 12V24M30 13H37L34.5 17L37 21H30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </>}
  </svg>;
}
