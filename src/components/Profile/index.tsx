import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import "../profileCalendar.scss";

type ProfileCardProps = {
    profile: UserInstance;
};

 const ProfileCard = ({ profile }: ProfileCardProps) => {  
  return (
    <div className="profile-section">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="profile-header-info">
            <h2 className="profile-name">Welcome, </h2>
            <h2 className="profile-name">{profile?.name}</h2>
          </div>
        </div>
        <div className="profile-details">
          <div className="profile-detail-item">
            <div className="detail-content">
              <span className="detail-label">Email</span>
              <span className="detail-value">{profile?.email ?? AuthSession.getEmail()}</span>
              <span className="detail-label">Role</span>
              <span className="detail-value">{profile?.role?.name ?? AuthSession.getRoles()?.name ?? 'No Role'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;