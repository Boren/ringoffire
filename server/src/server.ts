import * as express from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';
import * as crypto from 'crypto';
import * as winston from 'winston';

import { SocketInEvent, SocketOutEvent, GameState, Errors, CardSuit, CardValue } from './constants';
import { Card, Deck, Room } from './types';

const app = express();
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
  io.in(roomname).emit(SocketOutEvent.SYNC, { room: rooms.get(roomname) });
};

io.sockets.on('connection', socket => {
  logger.info('User socket connected');

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

    socket.emit(SocketOutEvent.ROOM_CREATED, {
      roomName: roomname,
    });

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
        owner: socket.id,
        intervalId: intervalId,
      });

      userRooms.set(socket.id, roomname);

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

    const roomname = e.roomname as string;

    if (rooms.has(roomname)) {
      const room = rooms.get(roomname);

      if (room.gameState === GameState.WAITING_FOR_PLAYERS) {
        logger.info(`Room ${roomname}: User ${username} (${socket.id}) joined`);
        socket.join(roomname, () => {
          rooms.get(roomname).users.set(socket.id, { username: username, id: socket.id });
          userRooms.set(socket.id, roomname);
          //socket.emit(SocketOutEvent.ROOM_JOIN_SUCCESS, { room: rooms.get(roomname) });
          io.in(roomname).emit(SocketOutEvent.PLAYER_JOINED, { username: username, id: socket.id });
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

    switch (card.value) {
      case CardValue.ACE:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text:
            'Waterfall: the player with the card starts drinking and it goes round the circle, when it gets back to the player they can then stop drinking and then it follows round',
        });
        break;

      case CardValue.TWO:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'You: Pick someone to drink',
        });
        break;

      case CardValue.THREE:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'Me: Drink yourself',
        });
        break;

      case CardValue.FOUR:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'Whores: All girls drink',
        });
        break;

      case CardValue.FIVE:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text:
            'Thumb master: The person with the card may place their thumb on the table at any time during the game and the last person to do so has to drink',
        });
        break;

      case CardValue.SIX:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'Dicks: all guys drink',
        });
        break;

      case CardValue.SEVEN:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text:
            'Heaven: The person with the card may raise their hand at any time during the game and the last person to do so has to drink',
        });
        break;

      case CardValue.EIGHT:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'Mate: pick a mate who has to drink with you',
        });
        break;

      case CardValue.NINE:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text:
            "Rhyme: Say a word and go round the circle rhyming with that word, whoever hesitates or can't think of a rhyming word has to drink, words with no rhyme such as orange are banned",
        });
        break;

      case CardValue.TEN:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text:
            "Categories: say a word from that category and go round the circle, whoever hesitates or can't think of a word associated with that category has to drink",
        });
        break;

      case CardValue.JACK:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'Rule: Make a new rule for the game',
        });
        break;

      case CardValue.QUEEN:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text:
            'Question master: if you ask a player a question and they answer they have to drink, if they answer the question with "Fuck you question master" then you have to drink',
        });
        break;

      case CardValue.KING:
        room.currentPlayer = getNextPlayer(room);
        io.in(room.name).emit(SocketOutEvent.CARD_DRAWN, {
          card: card,
          currentPlayer: room.currentPlayer,
          text: 'Whores: All girls drink',
        });
        break;
    }
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
      io.in(room.name).emit(SocketOutEvent.GAME_STARTED, { currentPlayer: room.currentPlayer });
    } else {
      socket.emit(SocketOutEvent.ERROR, { error: Errors.NOT_CREATOR, info: '' });
    }
  });

  // TODO
  socket.on(SocketInEvent.LEAVE_ROOM, e => {
    logger.info(`Event: ${SocketInEvent.LEAVE_ROOM}`);
    logger.info(e);

    io.emit('Creating room');
  });
});

// TODO: Handle disconnect

server.listen(process.env.PORT || 3000, function() {
  logger.info(`Listening on port ${process.env.PORT || 3000}`);
});
