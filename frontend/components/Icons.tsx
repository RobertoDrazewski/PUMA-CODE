/* ============================================================
   Iconos SVG propios de Puma Code — estilo línea fina (stroke),
   coherentes con la estética futurista del sitio.
   Sin dependencias externas: heredan el color via currentColor
   y el glow via la clase .icon-fx del contenedor.
   ============================================================ */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const Base = ({ children, ...props }: IconProps & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

/* --- Servicios --- */
export const Globe = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.6 2.7 2.6 15.3 0 18" />
    <path d="M12 3c-2.6 2.7-2.6 15.3 0 18" />
  </Base>
);

export const Smartphone = (p: IconProps) => (
  <Base {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18h2" />
  </Base>
);

export const Radio = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="1.6" />
    <path d="M8.6 8.6a4.8 4.8 0 0 0 0 6.8" />
    <path d="M15.4 8.6a4.8 4.8 0 0 1 0 6.8" />
    <path d="M5.8 5.8a8.8 8.8 0 0 0 0 12.4" />
    <path d="M18.2 5.8a8.8 8.8 0 0 1 0 12.4" />
  </Base>
);

export const Cpu = (p: IconProps) => (
  <Base {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5" />
  </Base>
);

export const Bot = (p: IconProps) => (
  <Base {...p}>
    <rect x="4.5" y="8" width="15" height="12" rx="2.5" />
    <path d="M12 8V4.5" />
    <circle cx="12" cy="3.5" r="1" />
    <path d="M2 14h2.5M19.5 14H22" />
    <path d="M9 12.8v2M15 12.8v2" />
  </Base>
);

export const Gem = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 3h12l4 6-10 13L2 9Z" />
    <path d="M11 3 8 9l4 13 4-13-3-6" />
    <path d="M2 9h20" />
  </Base>
);

/* --- Proceso --- */
export const MessageCircle = (p: IconProps) => (
  <Base {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Base>
);

export const ScanEye = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const ClipboardList = (p: IconProps) => (
  <Base {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6M9 16h6" />
  </Base>
);

export const Settings = (p: IconProps) => (
  <Base {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

/* --- IA / features --- */
export const TrendingUp = (p: IconProps) => (
  <Base {...p}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M14 7h7v7" />
  </Base>
);

export const Zap = (p: IconProps) => (
  <Base {...p}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
  </Base>
);

/* --- Industrias --- */
export const Sprout = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 21v-8" />
    <path d="M12 13c0-4.2-2.6-6.6-7-7 .4 4.6 2.9 7 7 7z" />
    <path d="M12 13c0-3.1 2-5.1 6-5.5-.3 3.6-2.4 5.5-6 5.5z" />
    <path d="M7 21h10" />
  </Base>
);

export const Gauge = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 14.5 16 10" />
    <circle cx="12" cy="14.5" r="1.4" />
    <path d="M4.3 18.5a9 9 0 1 1 15.4 0" />
  </Base>
);

export const Truck = (p: IconProps) => (
  <Base {...p}>
    <path d="M2 16.5V7a1 1 0 0 1 1-1h11v10.5" />
    <path d="M14 9.5h4l4 4v3h-2.3" />
    <circle cx="7" cy="17.8" r="1.9" />
    <circle cx="17.4" cy="17.8" r="1.9" />
    <path d="M9 17.8h6.4" />
  </Base>
);

export const Package = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.3 7 12 12l8.7-5" />
    <path d="M12 22V12" />
  </Base>
);

/* --- Seguridad --- */
export const Shield = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 22s8-3.6 8-10V5.2L12 2 4 5.2V12c0 6.4 8 10 8 10z" />
  </Base>
);

export const ShieldCheck = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 22s8-3.6 8-10V5.2L12 2 4 5.2V12c0 6.4 8 10 8 10z" />
    <path d="m9 11.6 2.1 2.1 4-4.2" />
  </Base>
);

export const Search = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.2-4.2" />
  </Base>
);

export const Lock = (p: IconProps) => (
  <Base {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Base>
);

export const FileText = (p: IconProps) => (
  <Base {...p}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z" />
    <path d="M14 2v5h5" />
    <path d="M9 13h6M9 17h6" />
  </Base>
);

export const Radar = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 12l5.5-5.5" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </Base>
);

/* --- Express --- */
export const Store = (p: IconProps) => (
  <Base {...p}>
    <path d="m3 9 1.4-5.5h15.2L21 9" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 12v9h14v-9" />
    <path d="M9.5 21v-5.5h5V21" />
  </Base>
);

export const ShoppingCart = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="20" r="1.5" />
    <circle cx="17.3" cy="20" r="1.5" />
    <path d="M2.5 3.5H5l2.6 12.3a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.5-1.2L21 8H6" />
  </Base>
);

export const LayoutDashboard = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="8" height="10" rx="1.5" />
    <rect x="13" y="3" width="8" height="6" rx="1.5" />
    <rect x="13" y="11" width="8" height="10" rx="1.5" />
    <rect x="3" y="15" width="8" height="6" rx="1.5" />
  </Base>
);

export const GridPlus = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="8" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
    <path d="M17 14.5v5M14.5 17h5" />
  </Base>
);

/* --- Varios --- */
export const Star = (p: IconProps) => (
  <Base {...p}>
    <path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z" />
  </Base>
);

export const Clock = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);
