import React from 'react';

import { RoomDTO } from './types';

type RulesProps = {
  gameState: RoomDTO;
};

export const Rules: React.FC<RulesProps> = props => {
  const { gameState } = props;

  return (
    <>
      <div className={'text-6xl font-extrabold text-blue-600 mb-12'}>
        Rules
      </div>
      <ul>
        {gameState.rules.map(rule => (
          <li key={rule}>
            <span className={"text-xl"}>{rule}</span>;
          </li>
        ))}
      </ul>
    </>
  );
};
