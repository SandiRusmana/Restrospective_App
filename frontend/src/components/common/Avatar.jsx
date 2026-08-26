import React from 'react';

export default function Avatar({ 
  src, 
  alt = 'Avatar', 
  initial = 'U', 
  color = '#5956e9', 
  size = 'md', 
  isOnline = false 
}) {
  if (src) {
    return (
      <div className="member-avatar-wrapper">
        <img 
          src={src} 
          alt={alt} 
          className={size === 'sm' ? 'user-avatar-img' : 'member-avatar-img'} 
        />
        {isOnline && <span className="member-online-dot" />}
      </div>
    );
  }

  const avatarSizeClass = size === 'sm' ? 'workspace-avatar-sm' : 'workspace-avatar';

  return (
    <div 
      className={avatarSizeClass} 
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
