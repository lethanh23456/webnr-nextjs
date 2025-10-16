"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import UserService from '../../services/userService';

interface User {
  username: string;
  displayName?: string;
  level?: number;
  title?: string;
  achievements?: number;
  winStreak?: number;
  role?: string;
}

type DepositType = 'vang' | 'ngoc';

function User() {
  const [user, setUser] = useState<User | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [vangNapTuWeb, setVangNapTuWeb] = useState<number>(0);
  const [ngocNapTuWeb, setNgocNapTuWeb] = useState<number>(0);

  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositType, setDepositType] = useState<DepositType>('vang');
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  
  const router = useRouter();

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  useEffect(() => {
    if (user?.username) {
      loadBalance();
    }
  }, [user]);

  const loadUserFromStorage = () => {
    setInitialLoading(true);
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setInitialLoading(false);
  };

  const loadBalance = () => {
    if (!user?.username) return;

    setLoading(true);
    UserService.getBalance(user.username)
      .then(result => {
        if (result.success) {
          setVangNapTuWeb(result.data.vangNapTuWeb || 0);
          setNgocNapTuWeb(result.data.ngocNapTuWeb || 0);
          setCurrentBalance(result.data.currentBalance || 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    setVangNapTuWeb(0);
    setNgocNapTuWeb(0);
    setCurrentBalance(0);
    router.push('/login');
  };

  const handleDeposit = () => {
    if (!user?.username) return;

    const validation = UserService.validateDepositAmount(depositAmount);
    if (!validation.isValid) return;

    setLoading(true);
    const action =
      depositType === 'vang'
        ? UserService.addVangNapTuWeb(user.username, validation.amount!)
        : UserService.addNgocNapTuWeb(user.username, validation.amount!);

    action
      .then(result => {
        if (result.success && result.data) {
          if (depositType === 'vang') setVangNapTuWeb(result.data.totalVangNapTuWeb!);
          else setNgocNapTuWeb(result.data.totalNgocNapTuWeb!);

          setDepositAmount('');
          setShowDepositModal(false);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatNumber = (num: number): string =>
    new Intl.NumberFormat('vi-VN').format(num);

  const openDepositModal = (type: DepositType) => {
    setDepositType(type);
    setShowDepositModal(true);
  };

   useEffect(() => {
        if (!initialLoading && !user) {
            router.push('/register');
        }
    }, [initialLoading, user, router]);


  if (initialLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="text-white mt-4 text-center">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:scale-105 transition-transform duration-300">
              <div className="relative mx-auto w-32 h-32 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-1 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-6xl">🎮</span>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold shadow-lg border-4 border-gray-900">
                  {user.level || 1}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-center text-white mb-2">
                {user.displayName || user.username}
              </h2>
              <p className="text-center text-gray-300 mb-1">@{user.username}</p>
              <p className="text-center text-yellow-400 font-semibold mb-6">{user.title || "New Player"}</p>
              
              <div className="space-y-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center">
                  <span className="text-gray-300">🏆 Thành tích</span>
                  <span className="text-white font-bold text-xl">{formatNumber(user.achievements || 0)}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex justify-between items-center">
                  <span className="text-gray-300">🔥 Chuỗi thắng</span>
                  <span className="text-orange-400 font-bold text-xl">{user.winStreak || 0}</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-red-500/50 transform hover:-translate-y-1"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </div>

         
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
              <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                💰 Tài khoản hiện có
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-yellow-500/30 to-orange-500/30 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/50 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">💎</div>
                  <div className="text-gray-300 text-sm mb-2">Vàng nạp từ web</div>
                  <div className="text-3xl font-bold text-yellow-400">{formatNumber(vangNapTuWeb)}</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/50 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">💠</div>
                  <div className="text-gray-300 text-sm mb-2">Ngọc nạp từ web</div>
                  <div className="text-3xl font-bold text-purple-400">{formatNumber(ngocNapTuWeb)}</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/50 hover:scale-105 transition-transform">
                  <div className="text-4xl mb-3">💵</div>
                  <div className="text-gray-300 text-sm mb-2">Tiền mặt</div>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(currentBalance)}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => openDepositModal('vang')}
                  disabled={loading}
                  className="flex-1 min-w-[150px] bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Nạp Vàng
                </button>
                <button 
                  onClick={() => openDepositModal('ngoc')}
                  disabled={loading}
                  className="flex-1 min-w-[150px] bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Nạp Ngọc
                </button>
                <button 
                  onClick={loadBalance}
                  disabled={loading}
                  className="px-6 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-1 disabled:opacity-50"
                >
                  🔄 Làm mới
                </button>
              </div>
            </div>
          </div>
        </div>

     
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              ⚡ Hành động nhanh
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/shop')}
                className="bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-green-500/50 transform hover:-translate-y-2"
              >
                <div className="text-4xl mb-2">🛒</div>
                <div>Mua đồ</div>
              </button>
              <button className="bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-orange-500/50 transform hover:-translate-y-2">
                <div className="text-4xl mb-2">🎒</div>
                <div>Kho đồ</div>
              </button>
              <button className="bg-gradient-to-br from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700 text-white font-bold py-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-gray-500/50 transform hover:-translate-y-2">
                <div className="text-4xl mb-2">⚙️</div>
                <div>Cài đặt</div>
              </button>
            </div>
          </div>

        
          <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              📜 Hoạt động gần đây
            </h3>
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all">
                <span className="text-4xl">💎</span>
                <div className="flex-1">
                  <p className="text-white font-semibold">Mua Dragon Ball Set</p>
                  <small className="text-gray-400">2 giờ trước</small>
                </div>
                <span className="text-red-400 font-bold">-50,000₫</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all">
                <span className="text-4xl">🏆</span>
                <div className="flex-1">
                  <p className="text-white font-semibold">Thắng Tournament</p>
                  <small className="text-gray-400">5 giờ trước</small>
                </div>
                <span className="text-green-400 font-bold">+25,000₫</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 hover:bg-white/20 transition-all">
                <span className="text-4xl">💰</span>
                <div className="flex-1">
                  <p className="text-white font-semibold">Nạp tiền</p>
                  <small className="text-gray-400">1 ngày trước</small>
                </div>
                <span className="text-green-400 font-bold">+100,000₫</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDepositModal(false)}>
          <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 transform scale-100 animate-[scale-in_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              {depositType === 'vang' ? '💎 Nạp Vàng' : '💠 Nạp Ngọc'}
            </h3>
            
            <input
              type="number"
              placeholder={`Nhập số ${depositType === 'vang' ? 'vàng' : 'ngọc'} muốn nạp`}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              disabled={loading}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-4 text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent mb-6 disabled:opacity-50"
            />
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {depositType === 'vang' ? (
                <>
                  <button onClick={() => setDepositAmount('1000')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">1,000</button>
                  <button onClick={() => setDepositAmount('5000')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">5,000</button>
                  <button onClick={() => setDepositAmount('10000')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">10,000</button>
                  <button onClick={() => setDepositAmount('50000')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">50,000</button>
                </>
              ) : (
                <>
                  <button onClick={() => setDepositAmount('100')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">100</button>
                  <button onClick={() => setDepositAmount('500')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">500</button>
                  <button onClick={() => setDepositAmount('1000')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">1,000</button>
                  <button onClick={() => setDepositAmount('5000')} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/30">5,000</button>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDepositModal(false)}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button 
                onClick={handleDeposit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

     
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="text-white mt-4">Đang xử lý...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;