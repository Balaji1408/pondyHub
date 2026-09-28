import type { ReactNode } from 'react'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const filterIcons = {
  all: (
    <Icon>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  couples: (
    <Icon>
      <path d="M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />
    </Icon>
  ),
  family: (
    <Icon>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  ),
  friends: (
    <Icon>
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M3 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M14.5 14.8c.6-.2 1.3-.3 2-.3 2.5 0 4.5 1.7 4.5 4.5" />
    </Icon>
  ),
  bike: (
    <Icon>
      <circle cx="5.5" cy="16.5" r="3" />
      <circle cx="18.5" cy="16.5" r="3" />
      <path d="M5.5 16.5 9 10h6l3.5 6.5" />
      <path d="M9 10 7.5 7H5" />
      <path d="M15 10l-1.5-3H16" />
    </Icon>
  ),
  scooter: (
    <Icon>
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M8.5 17h7" />
      <path d="M15.5 17 14 7h3" />
      <path d="M4 14h6l1.5 3" />
    </Icon>
  ),
  car: (
    <Icon>
      <path d="M4 16v-3.5L6 8h12l2 4.5V16" />
      <path d="M3 16h18" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
      <path d="M6.5 12h11" />
    </Icon>
  ),
  anyDriver: (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
  selfDrive: (
    <Icon>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H21M17 12v3M20 12v2" />
    </Icon>
  ),
  withDriver: (
    <Icon>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v6.5M10.2 11 4 9.5M13.8 11 20 9.5" />
    </Icon>
  ),
  yacht: (
    <Icon>
      <path d="M12 3v12" />
      <path d="M12 4l6 10h-6" />
      <path d="M12 7 7 14h5" />
      <path d="M3 17.5h18l-2.5 3h-13z" />
    </Icon>
  ),
  paddle: (
    <Icon>
      <path d="M5 19 16 8" />
      <path d="M15 5.5a2.5 2.5 0 0 1 3.5 3.5L17 10.5 13.5 7z" />
      <path d="M3 21c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0" />
    </Icon>
  ),
  kayak: (
    <Icon>
      <path d="M2.5 14c4-2 15-2 19 0-4 2.5-15 2.5-19 0Z" />
      <path d="M6 7l12 12" />
      <path d="M4.5 5.5l2.5 1-1 1z" />
    </Icon>
  ),
  catamaran: (
    <Icon>
      <path d="M12 3v10" />
      <path d="M12 4l5 8h-5" />
      <path d="M3 15h7l-1 3H4z" />
      <path d="M14 15h7l-1 3h-5z" />
      <path d="M8 15v-1.5h8V15" />
    </Icon>
  ),
} satisfies Record<string, ReactNode>
