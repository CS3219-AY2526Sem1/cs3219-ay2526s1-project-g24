import { UserPresence } from '@/lib/collaboration/CollaborationManager';

interface PresenceIndicatorProps {
  users: UserPresence[];
  localClientId: number | null;
}

/**
 * Display connected users with avatars and names
 */
export default function PresenceIndicator({ users, localClientId }: PresenceIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  // Sort users so local user is first
  const sortedUsers = [...users].sort((a, b) => {
    if (a.clientId === localClientId) return -1;
    if (b.clientId === localClientId) return 1;
    return 0;
  });

  return (
    <div className='flex items-center gap-3'>
      <div className='flex items-center -space-x-3'>
        {sortedUsers.slice(0, 5).map((user) => (
          <div key={user.clientId} className='relative group' title={user.name}>
            <div
              className='w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-[#2e2e2e] cursor-pointer hover:scale-110 transition-transform shadow-lg'
              style={{ backgroundColor: user.color }}
            >
              {user.name
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase())
                .join('')}
            </div>

            {/* Tooltip */}
            <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#1e1e1e] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-[#3e3e3e] shadow-lg z-10'>
              {user.name}
              {user.clientId === localClientId && ' (You)'}
              <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[#1e1e1e]'></div>
            </div>

            {/* "You" indicator */}
            {user.clientId === localClientId && (
              <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#2e2e2e] shadow-sm'></div>
            )}
          </div>
        ))}

        {/* Show "+N more" if more than 5 users */}
        {sortedUsers.length > 5 && (
          <div
            className='w-9 h-9 rounded-full flex items-center justify-center bg-[#3e3e3e] text-white text-xs font-semibold border-2 border-[#2e2e2e] shadow-lg'
            title={`${sortedUsers.length - 5} more user(s)`}
          >
            +{sortedUsers.length - 5}
          </div>
        )}
      </div>

      {/* User count */}
      <span className='text-xs text-gray-400 font-medium'>
        {users.length} {users.length === 1 ? 'user' : 'users'} online
      </span>
    </div>
  );
}
