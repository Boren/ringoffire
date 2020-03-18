import React from 'react';

type PlayerProps = {
    name: string;
    currentTurn: boolean;
}

export const Player: React.FC<PlayerProps> = (props) => {
    const { name, currentTurn } = props;

    return <span className={currentTurn ? "text-5xl font-extrabold text-red-600" : "text-4xl"}>{name}</span>;
};
