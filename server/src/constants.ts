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
