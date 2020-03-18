import React from 'react';

import { RoomDTO } from './types';
import { Player } from './Player';

type PlayersProps = {
  gameState: RoomDTO;
  socket: SocketIOClient.Socket;
};

export const Players: React.FC<PlayersProps> = props => {
  const { gameState } = props;

  return (
    <>
      <div className={'text-6xl font-extrabold text-blue-600 mb-12'}>
        Players
      </div>
      <ul>
        {gameState.players.map(player => (
          <li key={player.id}>
            <Player
              name={player.username}
              currentTurn={gameState.currentPlayer === player.id}
            />
          </li>
        ))}
      </ul>
    </>
  );
};
