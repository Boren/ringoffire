import * as express from 'express';
import * as http from 'http';
import * as cors from 'cors';
import * as socketIo from 'socket.io';
import * as crypto from 'crypto';
import * as winston from 'winston';

import { SocketInEvent, SocketOutEvent, GameState, Errors, CardSuit, CardValue, RuleText } from './constants';
import { Card, Deck, Room, SocketPayloadSync, RoomDTO } from './types';

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server);

const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.simple(),
});

const shuffle = (a: Array<any>): Array<any> => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getRoomDTO = (room: Room): RoomDTO => {
  return {
    gameState: room.gameState,
    name: room.name,
    rules: room.rules,
    owner: room.owner,
    players: Array.from(room.users).map(([key, value]) => {
      return { username: value.username, id: value.id };
    }),
    currentCard: room.currentCard,
    currentText: room.currentText,
    currentPlayer: room.currentPlayer,
  };
};

const rooms: Map<string, Room> = new Map();
const userRooms: Map<string, string> = new Map();

const generateDeck = (): Deck => {
  const deck: Deck = [];

  for (const suit of ['spades', 'hearts', 'clubs', 'diamonds']) {
    for (const value in [...Array(13).keys()]) {
      deck.push({ suit: suit as CardSuit, value: (parseInt(value) + 1) as CardValue } as Card);
    }
  }

  shuffle(deck);
  return deck;
};

const getNextPlayer = (room: Room): string => {
  if (room.currentPlayerIterator == undefined) room.currentPlayerIterator = room.users.keys();

  let next = room.currentPlayerIterator.next();

  if (next.done) {
    room.currentPlayerIterator = room.users.keys();
    next = room.currentPlayerIterator.next();
  }

  return next.value;
};

const syncroom = (roomname: string): void => {
  io.in(roomname).emit(SocketOutEvent.SYNC, { room: getRoomDTO(rooms.get(roomname)) } as SocketPayloadSync);
};

// TODO
const deleteroom = (roomname: string): void => {
  return;
};

// TODO
const leaveroom = (roomname: string, id: string): void => {
  return;
};

io.sockets.on('connection', socket => {
  logger.info(`User socket connected. ID: ${socket.id}`);

  socket.on(SocketInEvent.CREATE_ROOM, e => {
    logger.info(`Event: ${SocketInEvent.CREATE_ROOM}. Data: ${JSON.stringify(e)}`);

    if (!e.username) {
      logger.info(`Room creation failed. No username.`);
      socket.emit(SocketOutEvent.ERROR, { error: Errors.MISSING_USERNAME, info: '' });
      return;
    }

    const username = e.username as string;

    if (userRooms.get(e.id)) {
      logger.info(`Room creation failed. Already in another room.`);
      socket.emit(SocketOutEvent.ERROR, { error: Errors.ALREADY_IN_ROOM, info: '' });
      return;
    }

    const roomname = crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase();

    const intervalId = setInterval(() => {
      syncroom(roomname);
    }, 5 * 1000);

    socket.join(roomname, () => {
      rooms.set(roomname, {
        gameState: GameState.WAITING_FOR_PLAYERS,
        deck: generateDeck(),
        name: roomname,
        users: new Map([[socket.id, { username: username, id: socket.id }]]),
        rules: [],
        currentPlayer: undefined,
        currentPlayerIterator: undefined,
        currentCard: undefined,
        currentText: '',
        owner: socket.id,
        intervalId: intervalId,
      });

      userRooms.set(socket.id, roomname);

      socket.emit(SocketOutEvent.ROOM_CREATED, {
        room: getRoomDTO(rooms.get(roomname)),
      });

      logger.info(`Room ${roomname}: Created `);
    });
  });

  socket.on(SocketInEvent.JOIN_ROOM, e => {
    logger.info(`Event: ${SocketInEvent.JOIN_ROOM}. Data: ${JSON.stringify(e)}`);

    if (!e.username) {
      logger.info(`Room joining failed. No username.`);
      socket.emit(SocketOutEvent.ERROR, { error: Errors.MISSING_USERNAME, info: '' });
      return;
    }

    const username = e.username as string;

    if (!e.roomname) {
      logger.info(`Room joining failed. No roomname.`);
      socket.emit(SocketOutEvent.ERROR, { error: Errors.MISSING_ROOMNAME, info: '' });
      return;
    }

    const roomname = (e.roomname as string).trim();

    if (rooms.has(roomname)) {
      const room = rooms.get(roomname);

      if (room.gameState === GameState.WAITING_FOR_PLAYERS) {
        logger.info(`Room ${roomname}: User ${username} (${socket.id}) joined`);
        socket.join(roomname, () => {
          rooms.get(roomname).users.set(socket.id, { username: username, id: socket.id });
          userRooms.set(socket.id, roomname);
          socket.emit(SocketOutEvent.ROOM_JOIN_SUCCESS, { room: getRoomDTO(rooms.get(roomname)) });
          io.in(roomname).emit(SocketOutEvent.PLAYER_JOINED, {
            username: username,
            id: socket.id,
            room: getRoomDTO(rooms.get(roomname)),
          });
        });
      } else {
        socket.emit(SocketOutEvent.ERROR, { error: Errors.WRONG_GAME_STATE, info: { gameState: room.gameState } });
      }
    } else {
      socket.emit(SocketOutEvent.ERROR, { error: Errors.ROOM_NOT_EXIST, info: '' });
    }
  });

  // TODO
  socket.on(SocketInEvent.DRAW, e => {
    logger.info(`Event: ${SocketInEvent.DRAW}. Data: ${JSON.stringify(e)}`);

    const room = rooms.get(userRooms.get(socket.id));

    if (room.gameState !== GameState.IN_PROGRESS) {
      logger.info(
        `Room ${room.name}: Player ${JSON.stringify(
          room.users.get(room.currentPlayer),
        )} tried to draw in wrong state. State was ${room.gameState}`,
      );
      socket.emit(SocketOutEvent.ERROR, { error: Errors.WRONG_GAME_STATE, info: '' });
      return;
    }

    if (room.currentPlayer !== socket.id) {
      logger.info(
        `Room ${room.name}: Player ${JSON.stringify(
          room.users.get(room.currentPlayer),
        )} tried to draw out of turn. Current player was ${room.currentPlayer}`,
      );
      socket.emit(SocketOutEvent.ERROR, { error: Errors.OUT_OF_TURN, info: '' });
      return;
    }

    // TODO: Handle empty deck
    const card = room.deck.pop();

    logger.info(
      `Room ${room.name}: Player ${JSON.stringify(room.users.get(room.currentPlayer))} drew ${JSON.stringify(card)}`,
    );

    room.currentPlayer = getNextPlayer(room);
    room.currentCard = card;
    room.currentText = RuleText[card.value];
    io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
      card: card,
      currentPlayer: room.currentPlayer,
      text: RuleText[card.value],
      room: getRoomDTO(room),
    });
  });

  // TODO
  socket.on(SocketInEvent.CREATE_RULE, e => {
    logger.info(`Event: ${SocketInEvent.CREATE_RULE}. Data: ${JSON.stringify(e)}`);

    const room = rooms.get(userRooms.get(socket.id));

    if (room.currentPlayer === socket.id && room.gameState === GameState.CREATING_RULE) {
      room.currentPlayer = getNextPlayer(room);
    }
  });

  socket.on(SocketInEvent.START_GAME, e => {
    logger.info(`Event: ${SocketInEvent.START_GAME}. Data: ${JSON.stringify(e)}`);

    const room = rooms.get(userRooms.get(socket.id));

    if (room.owner === socket.id) {
      logger.info(`Room ${room.name}: Starting game`);
      room.gameState = GameState.IN_PROGRESS;
      room.currentPlayer = getNextPlayer(room);
      io.in(room.name).emit(SocketOutEvent.GAME_STARTED, {
        currentPlayer: room.currentPlayer,
        room: getRoomDTO(room),
      });
    } else {
      socket.emit(SocketOutEvent.ERROR, { error: Errors.NOT_CREATOR, info: '' });
    }
  });

  socket.on(SocketInEvent.LEAVE_ROOM, e => {
    logger.info(`Event: ${SocketInEvent.LEAVE_ROOM}`);
    logger.info(e);

    if (userRooms.has(socket.id)) {
      const room = rooms.get(userRooms.get(socket.id));

      if (room.owner === socket.id) {
        logger.info(`Room ${room.name}: Deleting because owner disconnected`);
        deleteroom(room.name);
      } else {
        logger.info(`Room ${room.name}: User ${socket.id} disconnected. Leaving room`);
        leaveroom(room.name, socket.id);
      }
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User socket disconnected. ID: ${socket.id}`);

    if (userRooms.has(socket.id)) {
      const room = rooms.get(userRooms.get(socket.id));

      if (room.owner === socket.id) {
        logger.info(`Room ${room.name}: Deleting because owner disconnected`);
        deleteroom(room.name);
      } else {
        logger.info(`Room ${room.name}: User ${socket.id} disconnected. Leaving room`);
        leaveroom(room.name, socket.id);
      }
    }
  });
});

server.listen(process.env.PORT || 4000, function() {
  logger.info(`Listening on port ${process.env.PORT || 4000}`);
});
