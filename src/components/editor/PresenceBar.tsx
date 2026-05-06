'use client';

import { useEffect, useState } from 'react';
import { WebsocketProvider } from 'y-websocket';

interface User {
  name: string;
  color: string;
}

interface Props {
  provider: WebsocketProvider;
  currentUser: User;
}

export default function PresenceBar({ provider, currentUser }: Props) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const update = () => {
      const states = provider.awareness.getStates();
      const connected: User[] = [];
      states.forEach((state, clientId) => {
        if (clientId === provider.awareness.clientID) return;
        if (state.user) {
          connected.push(state.user);
        }
      });
      setUsers(connected);
    };

    provider.awareness.on('change', update);
    update();

    return () => {
      provider.awareness.off('change', update);
    };
  }, [provider]);

  const allUsers = [currentUser, ...users];

  if (allUsers.length <= 1) return null;

  return (
    <div className="flex items-center -space-x-1.5">
      {allUsers.slice(0, 5).map((user, i) => (
        <div
          key={i}
          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {allUsers.length > 5 && (
        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-[10px] font-bold text-white">
          +{allUsers.length - 5}
        </div>
      )}
    </div>
  );
}
