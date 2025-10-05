// Icon Components
const Icon = ({ className, children }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
)

export const Star = ({ className }) => (
  <Icon className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
)

export const Database = ({ className }) => (
  <Icon className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </Icon>
)

export const Zap = ({ className }) => (
  <Icon className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Icon>
)

export const X = ({ className }) => (
  <Icon className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </Icon>
)

export const Search = ({ className }) => (
  <Icon className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </Icon>
)

export const Archive = ({ className }) => (
  <Icon className={className}>
    <path d="M22 8v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8" />
    <path d="M14 4h-4a2 2 0 0 0-2 2v2h8V6a2 2 0 0 0-2-2Z" />
    <path d="M2 8h20" />
    <path d="M10 12h4" />
  </Icon>
)

export const CircleDollarSign = ({ className }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
    <path d="M12 18V6"></path>
  </Icon>
)

export const BrainCircuit = ({ className }) => (
  <Icon className={className}>
    <path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.05.36 2.05.97 2.85L7 10.5v1.28c0 .24.11.48.3.65L9.5 14v1.5c0 .51.41.93.92 1C11.13 16.9 12 17.5 12 18.5c0 .9-.38 1.6-1 2-1.63.93-3.13 2-4.5 2-1.12 0-2-.5-2.5-1" />
    <path d="M12 2a4.5 4.5 0 0 1 4.5 4.5c0 1.05-.36 2.05-.97 2.85L17 10.5v1.28c0 .24-.11.48-.3.65L14.5 14v1.5c0 .51-.41.93.92 1-.71.4-1.58 1-1.58 1.5s.38 1.6 1 2c1.63.93 3.13 2 4.5 2 1.12 0 2-.5 2.5-1" />
    <path d="M12 12.5a2.5 2.5 0 0 0-2.5 2.5v1.5a2.5 2.5 0 0 0 5 0V15a2.5 2.5 0 0 0-2.5-2.5Z" />
    <path d="M8 11.5a2.5 2.5 0 0 0-2.5 2.5v1.5a2.5 2.5 0 0 0 5 0V14a2.5 2.5 0 0 0-2.5-2.5Z" />
    <path d="M16 11.5a2.5 2.5 0 0 0-2.5 2.5v1.5a2.5 2.5 0 0 0 5 0V14a2.5 2.5 0 0 0-2.5-2.5Z" />
  </Icon>
)

export const LogOut = ({ className }) => (
  <Icon className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
)

export const User = ({ className }) => (
  <Icon className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
)
