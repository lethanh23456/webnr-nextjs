"use client";

import { useState } from 'react';
import Dice from './Dice'; // Đảm bảo bạn đã có file Dice.tsx

// --- Helper Functions & Types ---

type BoardSpaceData = {
  name: string;
  type: 'property' | 'corner' | 'chance' | 'tax' | 'station' | 'utility' | 'chest';
  color?: string;
  gridPosition: string;
};

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Dữ liệu bàn cờ (24 ô) ---
const boardLayout: BoardSpaceData[] = [
  // Hàng dưới (từ phải sang trái)
  { name: 'GO', type: 'corner', gridPosition: 'row-start-7 col-start-7' }, // 0
  { name: 'Tax', type: 'tax', color: 'bg-gray-500', gridPosition: 'row-start-7 col-start-6' }, // 1
  { name: 'Property 14', type: 'property', color: 'bg-purple-600', gridPosition: 'row-start-7 col-start-5' }, // 2
  { name: 'Property 13', type: 'property', color: 'bg-purple-600', gridPosition: 'row-start-7 col-start-4' }, // 3
  { name: 'Utility', type: 'utility', color: 'bg-gray-300 text-black', gridPosition: 'row-start-7 col-start-3' }, // 4
  { name: 'Property 12', type: 'property', color: 'bg-blue-800', gridPosition: 'row-start-7 col-start-2' }, // 5

  // Góc trái dưới
  { name: 'Jail', type: 'corner', gridPosition: 'row-start-7 col-start-1' }, // 6

  // Cột trái (từ dưới lên)
  { name: 'Property 8', type: 'property', color: 'bg-orange-500', gridPosition: 'row-start-6 col-start-1' }, // 7
  { name: 'Property 7', type: 'property', color: 'bg-orange-500', gridPosition: 'row-start-5 col-start-1' }, // 8
  { name: 'Station 1', type: 'station', color: 'bg-gray-100 text-black', gridPosition: 'row-start-4 col-start-1' }, // 9
  { name: 'Property 6', type: 'property', color: 'bg-pink-500', gridPosition: 'row-start-3 col-start-1' }, // 10
  { name: 'Property 5', type: 'property', color: 'bg-pink-500', gridPosition: 'row-start-2 col-start-1' }, // 11

  // Góc trái trên
  { name: 'Free Parking', type: 'corner', gridPosition: 'row-start-1 col-start-1' }, // 12

  // Hàng trên (từ trái sang phải)
  { name: 'Property 1', type: 'property', color: 'bg-red-600', gridPosition: 'row-start-1 col-start-2' }, // 13
  { name: 'Property 2', type: 'property', color: 'bg-red-600', gridPosition: 'row-start-1 col-start-3' }, // 14
  { name: 'Chance ?', type: 'chance', color: 'bg-blue-300', gridPosition: 'row-start-1 col-start-4' }, // 15
  { name: 'Property 3', type: 'property', color: 'bg-yellow-500', gridPosition: 'row-start-1 col-start-5' }, // 16
  { name: 'Property 4', type: 'property', color: 'bg-yellow-500', gridPosition: 'row-start-1 col-start-6' }, // 17

  // Góc phải trên
  { name: 'Go to Jail', type: 'corner', gridPosition: 'row-start-1 col-start-7' }, // 18

  // Cột phải (từ trên xuống)
  { name: 'Property 9', type: 'property', color: 'bg-green-500', gridPosition: 'row-start-2 col-start-7' }, // 19
  { name: 'Property 10', type: 'property', color: 'bg-green-500', gridPosition: 'row-start-3 col-start-7' }, // 20
  { name: 'Chest', type: 'chest', color: 'bg-blue-500', gridPosition: 'row-start-4 col-start-7' }, // 21
  { name: 'Station 2', type: 'station', color: 'bg-gray-100 text-black', gridPosition: 'row-start-5 col-start-7' }, // 22
  { name: 'Property 11', type: 'property', color: 'bg-blue-800', gridPosition: 'row-start-6 col-start-7' }, // 23
];

const totalSpaces = boardLayout.length; // 24 ô

// --- Components Con (BoardSpace & CornerSpace) ---

type SpaceProps = {
  space: BoardSpaceData;
  isHighlighted: boolean;
};

const BoardSpace = ({ space, isHighlighted }: SpaceProps) => (
  <div
    className={`p-1 flex items-center justify-center text-center 
                font-bold text-white text-xs ${space.gridPosition} ${space.color || 'bg-green-600'}
                relative transition-all duration-150 ease-in-out
                ${isHighlighted
        ? 'ring-4 ring-orange-400 shadow-lg shadow-orange-400/50 z-10 scale-110'
        : 'ring-1 ring-black'}`}
  >
    {space.type === 'property' && (
      <div
        className={`w-full h-1/4 absolute top-0 left-0 ${space.color?.replace('600', '400') || ''}`}
      ></div>
    )}
    <span className="relative z-10 pt-2">{space.name}</span>
  </div>
);

const CornerSpace = ({ space, isHighlighted }: SpaceProps) => (
  <div
    className={`p-2 flex items-center justify-center text-center 
                font-bold text-black bg-gray-300 ${space.gridPosition}
                transition-all duration-150 ease-in-out
                ${isHighlighted
        ? 'ring-4 ring-orange-400 shadow-lg shadow-orange-400/50 z-10 scale-110'
        : 'ring-1 ring-black'}`}
  >
    {space.name}
  </div>
);


// --- Component Chính ---

export default function Vongquay() {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [diceResult, setDiceResult] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  // STATE MỚI ĐỂ HIỂN THỊ KẾT QUẢ
  const [resultsList, setResultsList] = useState<string[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);

  /**
   * HÀM LOGIC CHÍNH ĐÃ SỬA
   * Xử lý quay cho 1, 5, hoặc 10 lượt.
   */
  const handleRoll = async (rollCount: number) => {
    if (isRolling) return;

    setIsRolling(true);
    setResultsList([]); // Xóa kết quả cũ

    const newResults: string[] = [];
    // Dùng 1 biến cục bộ để theo dõi vị trí chính xác qua các lượt quay (await)
    let currentLoopPosition = currentPosition;

    for (let i = 0; i < rollCount; i++) {
      // 1. Gieo xúc xắc (1-6)
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceResult(roll);
      await sleep(1000); // Chờ animation xúc xắc

      // 2. Di chuyển
      const startPositionOfThisTurn = currentLoopPosition;
      let finalPositionOfThisTurn = currentLoopPosition;

      for (let step = 1; step <= roll; step++) {
        finalPositionOfThisTurn = (startPositionOfThisTurn + step) % totalSpaces;
        setCurrentPosition(finalPositionOfThisTurn); // Cập nhật UI (ô sáng)
        await sleep(200); // Tốc độ di chuyển
      }

      // 3. Ghi nhận kết quả
      currentLoopPosition = finalPositionOfThisTurn; // Cập nhật vị trí cho lượt sau
      const wonItem = boardLayout[currentLoopPosition].name;
      newResults.push(wonItem);

      // Nếu còn lượt, tạm dừng 0.5s
      if (rollCount > 1 && i < rollCount - 1) {
        await sleep(500);
      }
    }

    // 4. Hoàn thành, hiển thị kết quả
    setResultsList(newResults);
    setShowResultsModal(true);
    setIsRolling(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen 
                    bg-gray-900 p-4 overflow-hidden">

      {/* Hiệu ứng nền */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 w-full h-full 
                        bg-gradient-radial from-blue-500 via-transparent to-transparent
                        transform -translate-x-1/2 -translate-y-1/2 blur-3xl 
                        animate-pulse-slow">
        </div>
      </div>

      {/* Container bàn cờ */}
      <div className="w-full max-w-xl md:max-w-2xl aspect-square z-10 relative">

        {/* Lưới 7x7 */}
        <div className="grid grid-cols-7 grid-rows-7 h-full border-4 border-blue-400 shadow-2xl shadow-blue-500/30">

          {/* Render 24 ô cờ */}
          {boardLayout.map((space, index) => {
            if (space.type === 'corner') {
              return <CornerSpace key={index} space={space} isHighlighted={index === currentPosition} />;
            }
            return <BoardSpace key={index} space={space} isHighlighted={index === currentPosition} />;
          })}

          {/* KHU VỰC TRUNG TÂM */}
          <div className="row-start-2 col-start-2 row-span-5 col-span-5
                        flex flex-col items-center justify-center 
                        border-2 border-blue-400 bg-blue-950/80 p-4 gap-6">

            <Dice isRolling={isRolling} result={diceResult} />

            <div className="flex flex-col gap-3 w-full max-w-xs">
              {/* CẬP NHẬT ONCLICK */}
              <button
                onClick={() => handleRoll(1)} // <--- SỬA Ở ĐÂY
                disabled={isRolling}
                className="w-full text-white font-bold py-3 px-6 rounded-lg 
                           bg-gradient-to-r from-blue-500 to-blue-700 
                           border-2 border-blue-300 shadow-lg
                           hover:from-blue-600 hover:to-blue-800
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all transform hover:scale-105"
              >
                {isRolling ? 'Đang Lắc...' : 'Lắc 1 Lần (20FC)'}
              </button>

              <button
                onClick={() => handleRoll(5)} // <--- SỬA Ở ĐÂY
                disabled={isRolling}
                className="w-full text-white font-bold py-3 px-6 rounded-lg 
                           bg-gradient-to-r from-cyan-500 to-cyan-700 
                           border-2 border-cyan-300 shadow-lg
                           hover:from-cyan-600 hover:to-cyan-800
                           disabled:opacity-50 transition-all transform hover:scale-105"
              >
                {isRolling ? 'Đang Lắc...' : 'Lắc 5 Lần (100FC)'}
              </button>

              <button
                onClick={() => handleRoll(10)} // <--- SỬA Ở ĐÂY
                disabled={isRolling}
                className="w-full text-white font-bold py-3 px-6 rounded-lg 
                           bg-gradient-to-r from-yellow-400 to-orange-500 
                           border-2 border-yellow-200 shadow-lg
                           hover:from-yellow-500 hover:to-orange-600
                           disabled:opacity-50 transition-all transform hover:scale-105"
              >
                {isRolling ? 'Đang Lắc...' : 'Lắc 10 Lần (200FC)'}
              </button>
            </div>
          </div>
        </div>

        {/* MODAL TỔNG KẾT KẾT QUẢ */}
        {showResultsModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 
                          border-2 border-yellow-400 text-white rounded-lg 
                          shadow-2xl shadow-yellow-500/30 p-6 w-full max-w-md m-4
                          animate-fade-in">
              <h2 className="text-3xl font-bold text-center text-yellow-300 mb-6 drop-shadow-lg">
                Kết Quả Lượt Quay
              </h2>

              {/* Danh sách vật phẩm */}
              <ul className="space-y-2 max-h-64 overflow-y-auto pr-2 mb-6 
                             scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-blue-900">
                {resultsList.map((item, index) => (
                  <li
                    key={index}
                    className="text-lg bg-white/5 p-3 rounded-md border border-white/20
                               flex justify-between items-center"
                  >
                    <span className="font-semibold text-gray-300">Lượt {index + 1}:</span>
                    <span className="font-bold text-yellow-100">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Nút đóng */}
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setResultsList([]);
                }}
                className="w-full text-black font-bold py-3 px-6 rounded-lg 
                           bg-gradient-to-r from-yellow-400 to-orange-500 
                           border-2 border-yellow-200 shadow-lg
                           hover:from-yellow-500 hover:to-orange-600
                           transition-all transform hover:scale-105"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}