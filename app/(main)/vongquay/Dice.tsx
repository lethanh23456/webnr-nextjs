// ./Dice.tsx

import React from 'react';

type DiceProps = {
    isRolling: boolean;
    result: number;
};

// Component này yêu cầu CÁC CLASS CSS trong file globals.css (xem bước 3)
const Dice = ({ isRolling, result }: DiceProps) => {
    return (
        // 'scene' tạo phối cảnh 3D
        <div className="scene w-20 h-20">
            {/* 'cube' là khối lập phương */}
            <div
                className={`cube ${isRolling ? 'animate-spin-dice' : ''} ${!isRolling ? `show-face-${result}` : ''}`}
            >

            </div>
        </div>
    );
};

export default Dice;