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
    <div className='flex flex-col'>
      {gameState.currentCard ? (
        <>
          <p className='flex-1 text-center  px-4 py-2 m-2'>
            <img
              className='w-1/3 mx-auto'
              src={`img/${
                gameState.currentCard.value
              }${gameState.currentCard.suit.substring(0, 1).toUpperCase()}.png`}
              alt=''
            />
          </p>
          <p className='flex-1 text-center  px-4 py-2 m-2'>
            {gameState.currentText}
          </p>
        </>
      ) : (
        <>
          <p className='flex-1 text-center  px-4 py-2 m-2'>
            <img src='img/back.png' className='w-1/3 mx-auto' alt='' />
          </p>
          <p className='flex-1 text-center  px-4 py-2 m-2'>
            Waiting for first draw
          </p>
        </>
      )}

      {gameState.currentPlayer === socket.id ? (
        <div className='flex-1 text-center  px-4 py-2 m-2'>
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
            type='button'
            onClick={drawCard}
          >
            Draw
          </button>
        </div>
      ) : (
        ''
      )}
    </div>
  );
};
