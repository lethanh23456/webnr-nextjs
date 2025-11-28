"use client"
import React, { useState } from 'react';
import './shop.scss';
import blackGoku from "../../public/assets/avt.png";
import trungdetu from "../../public/assets/trung_de_tu.png";
import aovaitho from "../../public/assets/ao.png";
import quanthanlinh from "../../public/assets/quan.png";
import gangvaitho from "../../public/assets/gang.png";
import giayvaitho from "../../public/assets/giay.png";
import rada from "../../public/assets/rada.png";
import { StaticImageData } from 'next/image';

interface Item {
  id: number;
  name: string;
  description: string;
  image: StaticImageData;
}

function Shop() {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  const items: Item[] = [
    {
      id: 1,
      name: 'Cải trang black goku',
      description: 'Cải trang thành Super Black Goku',
      image: blackGoku,
    },
    {
      id: 2,
      name: 'Trứng đệ tử',
      description: 'Sử dụng vật phẩm có thể giúp người chơi sở hữu đệ tử.',
      image: trungdetu,
    },
    {
      id: 3,
      name: 'Áo vải thô',
      description: 'Giúp giảm sát thương',
      image: aovaitho,
    },
    {
      id: 4,
      name: 'Quần thần linh',
      description: 'Giúp tăng HP',
      image: quanthanlinh,
    },
    {
      id: 5,
      name: 'Găng vải thô',
      description: 'Giúp tăng sức đánh',
      image: gangvaitho,
    },
    {
      id: 6,
      name: 'Giày vải thô',
      description: 'Giúp tăng MP',
      image: giayvaitho,
    },
    {
      id: 7,
      name: 'Rada',
      description: 'Giúp tăng Chí Mạng',
      image: rada,
    }
  ];

  const handleReceiveItem = async (itemId: number): Promise<void> => {
    try {
      const stored = localStorage.getItem("currentUser");
      
      if (!stored) {
        alert('Vui lòng đăng nhập để nhận vật phẩm!');
        return;
      }

      const userData = JSON.parse(stored);
      const authId = userData.auth_id;
      const accessToken = userData.access_token;

      if (!authId || !accessToken) {
        alert('Thông tin đăng nhập không hợp lệ!');
        return;
      }

      setLoading(true);
      setLoadingItemId(itemId);

      const response = await fetch('/api/add-item-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'auth-id': authId.toString(),
        },
        body: JSON.stringify({
          id: authId,
          itemId: itemId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Nhận vật phẩm thành công! Vào game để sử dụng.');
        console.log('Response:', data);
      } else {
        throw new Error(data.error || 'Không thể nhận vật phẩm');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể nhận vật phẩm';
      alert(errorMessage);
    } finally {
      setLoading(false);
      setLoadingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎁 Vật Phẩm Miễn Phí
          </h1>
          <p className="text-xl text-purple-200">
            Nhận ngay các vật phẩm hỗ trợ cho hành trình của bạn
          </p>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <div 
              key={item.id} 
              className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-6">
                <img 
                  src={item.image.src} 
                  alt={item.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  {item.name}
                </h3>
                <p className="text-purple-200 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Action Button */}
                <button
                  onClick={() => handleReceiveItem(item.id)}
                  disabled={loading && loadingItemId === item.id}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && loadingItemId === item.id ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <span>🎁</span>
                      <span>Nhận Miễn Phí</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-yellow-200 text-lg">
              ⚠️ <strong>Lưu ý:</strong> Vật phẩm sẽ được thêm vào tài khoản của bạn. 
              Vào game để kiểm tra và sử dụng!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;