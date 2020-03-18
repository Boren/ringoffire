import React from 'react';

import { RoomDTO } from './types';
import { SocketInEvent } from './constants';

type CardsProps = {
  gameState: RoomDTO;
  socket: SocketIOClient.Socket;
};

export const Cards: React.FC<CardsProps> = props => {
  const { gameState, socket } = props;

  const drawCard = () => {
    socket.emit(SocketInEvent.DRAW, {});
  };

  return (
    <>
      {gameState.currentCard ? (
        <>
          <p>
            <img
              src={`img/${
                gameState.currentCard.value
              }${gameState.currentCard.suit.substring(0, 1).toUpperCase()}.png`}
              alt=''
            />
          </p>
          <p>{gameState.currentText}</p>
        </>
      ) : (
        <>
          <p>
            <img src='img/back.png' alt='' />
          </p>
          <p>Waiting for first draw</p>
        </>
      )}

      {gameState.currentPlayer === socket.id ? (
        <button
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
          type='button'
          onClick={drawCard}
        >
          Draw
        </button>
      ) : (
        ''
      )}
    </>
  );
};
