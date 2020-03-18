import { GameState, CardSuit, CardValue } from './constants';

export type User = {
  id: string;
  username: string;
};

export type Room = {
  gameState: GameState;
  name: string;
  deck: Deck;
  rules: Array<string>;
  owner: string;
  users: Map<string, User>;
  currentCard: Card;
  currentText: string;
  currentPlayer: string;
  currentPlayerIterator: IterableIterator<string>;
  intervalId: NodeJS.Timeout;
};

export type RoomDTO = {
  gameState: GameState;
  name: string;
  rules: Array<string>;
  owner: string;
  players: Array<{ username: string; id: string }>;
  currentCard: Card;
  currentText: string;
  currentPlayer: string;
};

export type Card = {
  suit: CardSuit;
  value: CardValue;
};

export type Deck = Array<Card>;

export type SocketPayloadSync = {
  room: RoomDTO;
};

export type SocketPayloadCreateRoom = {
  username: string;
}

export type SocketPayloadJoinRoom = {
  username: string;
  roomname: string;
}
