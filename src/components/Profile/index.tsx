import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import { useState } from "react";
import "../profileCalendar.scss";

type ProfileCardProps = {
    profile: UserInstance;
};

 const ProfileCard = ({ profile }: ProfileCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="profile-section">
      <div className={`profile-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="profile-avatar-wrapper" onClick={() => setIsExpanded(!isExpanded)}>
          {!isExpanded ? (
            <div className="profile-welcome">
              <span className="welcome-icon">👋</span>
              <div className="welcome-text">
                <span className="welcome-label">Welcome</span>
                <span className="welcome-name">{profile?.name || 'User'}</span>
              </div>
            </div>
          ) : (
            <div className="profile-avatar">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="profile-content">
            <div className="profile-header-info">
              <h2 className="profile-name">Welcome, {profile?.name}</h2>
            </div>
            <div className="profile-details">
              <div className="profile-detail-item">
                <div className="detail-row">
                  <span className="detail-icon">✉️</span>
                  <span className="detail-value">{profile?.email ?? AuthSession.getEmail()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-icon">👤</span>
                  <span className="detail-value">{profile?.role?.name ?? AuthSession.getRoles()?.name ?? 'No Role'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;