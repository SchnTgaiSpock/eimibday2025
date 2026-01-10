export function ProfilePicture({ url, initials }: { url?: string; initials?: string }) {
  return <div className="profile-picture">
    {
      url ? <img src={url} /> : <span>{initials}</span>
    }
  </div>
}