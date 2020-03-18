import React, { useState, useEffect, useCallback } from 'react';
import { SocketOutEvent, SocketInEvent, GameState } from './constants';

import socketIOClient from 'socket.io-client';
import {
  RoomDTO,
  SocketPayloadSync,
  SocketPayloadCreateRoom,
  SocketPayloadJoinRoom,
} from './types';
import { Players } from './Players';
import { Cards } from './Cards';
import { Rules } from './Rules';

const App = () => {
  const ENDPOINT = 'https://rof-api.bore.ai';

  const [gameState, setGameState] = useState<RoomDTO>();
  const [socket, setSocket] = useState<SocketIOClient.Socket>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(undefined);
  const [roomname, setRoomname] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const client = socketIOClient(ENDPOINT);
    client.on('connect', () => {
      setConnected(true);
      setError(undefined);
    });
    client.on('disconnect', () => {
      setConnected(false);
      setError(undefined);
    });
    client.on('connect_failed', (reason: any) => setError(reason));

    client.on(SocketOutEvent.SYNC, (data: SocketPayloadSync): void => {
      setGameState(data.room);
    });

    client.on(SocketOutEvent.CARD_DRAWN, (data: SocketPayloadSync): void => {
      setGameState(data.room);
    });

    client.on(SocketOutEvent.PLAYER_JOINED, (data: SocketPayloadSync): void => {
      setGameState(data.room);
    });

    client.on(SocketOutEvent.ROOM_CREATED, (data: SocketPayloadSync): void => {
      setGameState(data.room);
    });

    client.on(SocketOutEvent.ROOM_JOIN_SUCCESS, (data: SocketPayloadSync): void => {
      setGameState(data.room);
    });

    client.on(SocketOutEvent.GAME_STARTED, (data: SocketPayloadSync): void => {
      setGameState(data.room);
    });

    setSocket(client);
  }, []);

  const createRoom = useCallback((): void => {
    if (socket) {
      socket.emit(SocketInEvent.CREATE_ROOM, {
        username: username,
      } as SocketPayloadCreateRoom);
    }
  }, [socket, username]);

  const joinRoom = useCallback((): void => {
    if (socket) {
      socket.emit(SocketInEvent.JOIN_ROOM, {
        username: username,
        roomname: roomname,
      } as SocketPayloadJoinRoom);
    }
  }, [roomname, socket, username]);

  const startGame = useCallback((): void => {
    if (socket) {
      socket.emit(SocketInEvent.START_GAME, {
      });
    }
  }, [socket]);

  if (!socket || !connected) {
    return (
      <div className='App'>
        <div className='flex flex-row items-stretch'>
          <div className='flex-1 text-center  px-4 py-2 m-2'>Connecting...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='App'>
        <div className='flex flex-row items-stretch'>
          <div className='flex-1 text-center  px-4 py-2 m-2'>{error}</div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className='App'>
        <div className='flex flex-row items-stretch'>
          <div className='flex-1 text-center  px-4 py-2 m-2'>
            <label htmlFor='username' className='text-sm block font-bold  pb-2'>
              Username
            </label>
            <input
              type='text'
              name='username'
              id=''
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline border-blue-300 '
              placeholder='Blendust'
              value={username}
              onChange={event => {
                setUsername(event.target.value);
              }}
            />
          </div>
          <div className='flex-1 text-center  px-4 py-2 m-2'>
            <div>
              <button
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                type='button'
                onClick={createRoom}
              >
                Create
              </button>
            </div>
          </div>

          <div className='flex-1 text-center  px-4 py-2 m-2'>
            <label htmlFor='room' className='text-sm block font-bold  pb-2'>
              Room
            </label>
            <input
              type='text'
              name='room'
              id=''
              className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline border-blue-300 '
              placeholder='A1B2C3'
              value={roomname}
              onChange={event => {
                setRoomname(event.target.value);
              }}
            />
            <button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
              type='button'
              onClick={joinRoom}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='App'>
      <div className='flex flex-col items-stretch'>
        <span className='flex-1 px-4 pt-2 mt-2 text-center text-4xl font-extrabold text-blue-600'>
          {gameState.name}
        </span>
        <span className='flex-1 px-4 pb-2 mb-2 text-center text-xl text-italic'>
          {gameState.gameState}
        </span>
        {gameState.owner === socket.id && gameState.gameState === GameState.WAITING_FOR_PLAYERS ? (
          <div className="flex-1 px-4 py-2 m-2 text-center">
            <button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
              type='button'
              onClick={startGame}
            >
              Start
            </button>
            </div>
          ) : (
            ''
          )}
      </div>
      <div className='flex flex-row items-stretch'>
        <div className='flex-1 text-center  px-4 py-2 m-2'>
          <Players gameState={gameState} socket={socket} />
        </div>
        <div className='flex-1 text-center  px-4 py-2 m-2'>
          <Cards gameState={gameState} socket={socket} />
        </div>
        <div className='flex-1 text-center  px-4 py-2 m-2'>
          <Rules gameState={gameState} />
        </div>
      </div>
    </div>
  );
};

export default App;
