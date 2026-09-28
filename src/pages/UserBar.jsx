import { logout } from '../utils/auth'
import './UserBar.css'


function UserBar({
  user,
  onLogout,
  text,
}) {
  const handleLogout = () => {
    logout()
    onLogout()
  }


  const roleLabel =
    user?.role === 'caregiver'
      ? text.caregiver
      : text.elderlyUser


  const initial =
    user?.full_name
      ? user.full_name
          .charAt(0)
          .toUpperCase()
      : '?'


  const isCaregiver =
    user?.role === 'caregiver'


  return (
    <div className="user-bar">

      <div className="user-bar-info">

        <div
          className={`user-bar-avatar ${
            isCaregiver
              ? 'user-bar-avatar--caregiver'
              : 'user-bar-avatar--elderly'
          }`}
          aria-hidden="true"
        >
          {initial}
        </div>


        <div className="user-bar-details">

          <strong className="user-bar-name">
            {user?.full_name}
          </strong>


          <span
            className={`user-bar-role ${
              isCaregiver
                ? 'user-bar-role--caregiver'
                : 'user-bar-role--elderly'
            }`}
          >
            <span
              className="user-bar-role-dot"
              aria-hidden="true"
            />

            {roleLabel}
          </span>

        </div>

      </div>


      <button
        type="button"
        className="user-bar-logout"
        onClick={handleLogout}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10 5H6.5C5.67 5 5 5.67 5 6.5V17.5C5 18.33 5.67 19 6.5 19H10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          <path
            d="M13 8L17 12L13 16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M9 12H17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>

        <span>
          {text.logout}
        </span>
      </button>

    </div>
  )
}


export default UserBar