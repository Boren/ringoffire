export enum GameState {
  WAITING_FOR_PLAYERS = 'waiting-for-players',
  IN_PROGRESS = 'in-progress',
  CREATING_RULE = 'creating-rule',
}

export enum CardSuit {
  SPADES = 'spades',
  DIAMONDS = 'diamonds',
  HEARTHS = 'hearths',
  CLUBS = 'clubs',
}

export enum CardValue {
  ACE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
}

export enum SocketInEvent {
  CREATE_ROOM = 'create-room',
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',

  CREATE_RULE = 'create-rule',
  DRAW = 'draw',
  START_GAME = 'start-game',
}

export enum SocketOutEvent {
  ROOM_CREATED = 'room-created',
  PLAYER_JOINED = 'player-joined',
  PLAYER_LEFT = 'player-left',
  ERROR = 'rof-error',

  RULE_CREATED = 'rule-created',
  CARD_DRAWN = 'card-drawn',
  GAME_STARTED = 'game-started',
  ROOM_JOIN_SUCCESS = 'room-join-success',
  ROOM_UPDATE = 'room-update',
  SYNC = 'sync-room',
}

export enum Errors {
  WRONG_GAME_STATE = 'wrong-game-state',
  OUT_OF_TURN = 'out-of-turn',
  NOT_CREATOR = 'not-creator',
  ROOM_NOT_EXIST = 'room-not-exist',
  MISSING_USERNAME = 'missing-username',
  MISSING_ROOMNAME = 'missing-roomname',
  ALREADY_IN_ROOM = 'already-in-room',
}

export const RuleText = {
  1: 'Waterfall: the player with the card starts drinking and it goes round the circle, when it gets back to the player they can then stop drinking and then it follows round',
  2: 'You: Pick someone to drink',
  3: 'Me: Drink yourself',
  4: 'Whores: All girls drink',
  5: 'Thumb master: The person with the card may place their thumb on the table at any time during the game and the last person to do so has to drink',
  6: 'Dicks: all guys drink',
  7: 'Heaven: The person with the card may raise their hand at any time during the game and the last person to do so has to drink',
  8: 'Mate: pick a mate who has to drink with you',
  9: "Rhyme: Say a word and go round the circle rhyming with that word, whoever hesitates or can't think of a rhyming word has to drink, words with no rhyme such as orange are banned",
  10: "Categories: say a word from that category and go round the circle, whoever hesitates or can't think of a word associated with that category has to drink",
  11: 'Rule: Make a new rule for the game',
  12: 'Question master: if you ask a player a question and they answer they have to drink, if they answer the question with "Fuck you question master" then you have to drink',
  13: 'Whores: All girls drink',
};
