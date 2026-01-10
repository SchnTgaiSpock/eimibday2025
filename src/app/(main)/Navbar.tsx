import { ProfilePicture } from "./ProfilePicture";

export function Navbar() {
  return <nav>
    <div className="nav-item logo">
      <img src="/isami-industries.svg" alt="Isami Industries" />
    </div>
    <div className="nav-item">
      <div className="profile-picture-background">
        <ProfilePicture url="/pfp.png" initials="EI" />
      </div>
    </div>
    <svg
      viewBox="0 3 14 11"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 14 16 L -1 -3 M 6 -3 L 10 16" strokeWidth="1.5" />
    </svg>
  </nav>
}