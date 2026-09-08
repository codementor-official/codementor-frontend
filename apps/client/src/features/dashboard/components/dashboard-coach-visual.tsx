export function DashboardCoachVisual() {
  return <svg
    aria-hidden="true"
    viewBox="0 0 300 150"
    className="h-full w-full text-primary"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="coach-orbit" x1="56" y1="20" x2="244" y2="132" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity="0.78" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="coach-card" x1="112" y1="42" x2="190" y2="117" gradientUnits="userSpaceOnUse">
        <stop stopColor="currentColor" stopOpacity="0.18" />
        <stop offset="1" stopColor="currentColor" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M38 113C75 54 116 26 170 29C220 32 252 61 270 103" stroke="url(#coach-orbit)" strokeWidth="2" strokeDasharray="6 7" />
    <path d="M52 123C88 93 114 82 151 84C191 86 218 103 248 127" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
    <rect x="105" y="31" width="91" height="92" rx="24" fill="url(#coach-card)" stroke="currentColor" strokeOpacity="0.34" />
    <path d="M129 69C129 56.85 138.85 47 151 47C163.15 47 173 56.85 173 69V87C173 97.49 164.49 106 154 106H148C137.51 106 129 97.49 129 87V69Z" stroke="currentColor" strokeWidth="3" />
    <path d="M139 68C142 64 145.5 62 150 62C154.5 62 158 64 161 68M139 83C145.5 87 155.5 87 162 83" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="140" cy="75" r="2.5" fill="currentColor" /><circle cx="162" cy="75" r="2.5" fill="currentColor" />
    <path d="M151 39V30M151 24V20M117 51L110 44M185 51L192 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="151" cy="25" r="4" fill="currentColor" />
    <rect x="36" y="72" width="48" height="35" rx="9" className="fill-surface stroke-border" />
    <path d="M49 84H71M49 91H66M49 98H59" className="stroke-current" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <rect x="216" y="54" width="48" height="35" rx="9" className="fill-surface stroke-border" />
    <path d="M229 76L237 68L243 73L253 62" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="60" cy="38" r="7" fill="currentColor" opacity="0.16" /><circle cx="60" cy="38" r="3" fill="currentColor" />
    <circle cx="242" cy="116" r="6" fill="currentColor" opacity="0.2" /><circle cx="242" cy="116" r="2.5" fill="currentColor" />
    <path d="M87 28L90 35L97 38L90 41L87 48L84 41L77 38L84 35L87 28Z" fill="currentColor" opacity="0.62" />
    <path d="M213 99L216 105L222 108L216 111L213 117L210 111L204 108L210 105L213 99Z" fill="currentColor" opacity="0.46" />
  </svg>;
}
