import { minidenticon } from 'minidenticons';
import { useMemo } from 'react';

interface ProfileAvatarProps {
  profileImage?: string | null;
  nickname?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ProfileAvatar({
  profileImage,
  nickname = 'user',
  size = 'medium',
  className = '',
}: ProfileAvatarProps) {
  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large',
  };

  // Generate identicon SVG from nickname
  const identiconSvg = useMemo(() => {
    const svg = minidenticon(nickname, 95, 45);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [nickname]);

  if (profileImage) {
    return (
      <div className={`profile-avatar-img ${sizeClasses[size]} ${className}`}>
        <img src={profileImage} alt={`${nickname}'s profile`} />
      </div>
    );
  }

  return (
    <div className={`profile-avatar-img ${sizeClasses[size]} ${className}`}>
      <img src={identiconSvg} alt={`${nickname}'s avatar`} />
    </div>
  );
}
