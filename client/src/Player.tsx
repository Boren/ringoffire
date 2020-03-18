import React from 'react';

type PlayerProps = {
    name: string;
    currentTurn: boolean;
}

export const Player: React.FC<PlayerProps> = (props) => {
    const { name, currentTurn } = props;

    return <span className={currentTurn ? "font-extrabold text-red-600" : ""}>{name}</span>;
};
