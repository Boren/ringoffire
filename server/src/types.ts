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
  currentPlayer: string;
  currentPlayerIterator: IterableIterator<string>;
  intervalId: NodeJS.Timeout;
};

export type Card = {
  suit: CardSuit;
  value: CardValue;
};

export type Deck = Array<Card>;
