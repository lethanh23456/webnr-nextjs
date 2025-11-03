// "use client"
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation'
// import UserService from '../../../services/userService';

// interface User {
//   username: string;
//   displayName?: string;

//   role?: string;
// }

// type DepositType = 'vang' | 'ngoc';

// function User() {
//   const [user, setUser] = useState<User | null>(null);
//   const [currentBalance, setCurrentBalance] = useState<number>(0);
//   const [vangNapTuWeb, setVangNapTuWeb] = useState<number>(0);
//   const [ngocNapTuWeb, setNgocNapTuWeb] = useState<number>(0);
//   const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
//   const [depositAmount, setDepositAmount] = useState<string>('');
//   const [depositType, setDepositType] = useState<DepositType>('vang');
//   const [loading, setLoading] = useState<boolean>(false);
//   const [initialLoading, setInitialLoading] = useState<boolean>(true);
  
//   const router = useRouter();

//   useEffect(() => {
//     loadUserFromStorage();
//   }, []);

//   useEffect(() => {
//     if (user?.username) {
//       loadBalance();
//     }
//   }, [user]);

//   const loadUserFromStorage = () => {
//     setInitialLoading(true);
//     const savedUser = localStorage.getItem('currentUser');
//     if (savedUser) {
//       setUser(JSON.parse(savedUser));
//     }
//     setInitialLoading(false);
//   };

//   const loadBalance = () => {
//     if (!user?.username) return;
//     setLoading(true);
//     UserService.getBalance(user.username)
//       .then(result => {
//         if (result.success) {
//           setVangNapTuWeb(result.data.vangNapTuWeb || 0);
//           setNgocNapTuWeb(result.data.ngocNapTuWeb || 0);
//           setCurrentBalance(result.data.currentBalance || 0);
//         }
//       })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('currentUser');
//     setUser(null);
//     router.push('/login');
//   };

//   const handleDeposit = () => {
//     if (!user?.username) return;

//     const validation = UserService.validateDepositAmount(depositAmount);
//     if (!validation.isValid) return;

//     setLoading(true);
//     const action =
//       depositType === 'vang'
//         ? UserService.addVangNapTuWeb(user.username, validation.amount!)
//         : UserService.addNgocNapTuWeb(user.username, validation.amount!);

//     action
//       .then(result => {
//         if (result.success && result.data) {
//           if (depositType === 'vang') setVangNapTuWeb(result.data.totalVangNapTuWeb!);
//           else setNgocNapTuWeb(result.data.totalNgocNapTuWeb!);
//           setDepositAmount('');
//           setShowDepositModal(false);
//         }
//       })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   };

//   const formatNumber = (num: number): string =>
//     new Intl.NumberFormat('vi-VN').format(num);

//   const formatCurrency = (amount: number): string =>
//     new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

//   useEffect(() => {
//     if (!initialLoading && !user) {
//       router.push('/register');
//     }
//   }, [initialLoading, user, router]);

//   if (initialLoading || !user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <p className="text-gray-600">Đang tải thông tin người dùng...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 py-10 px-4">
//       <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
//         {/* Header */}
//         <div className="flex justify-between items-center border-b pb-4 mb-4">
//           <h1 className="text-2xl font-semibold text-gray-800">Xin chào, {user.displayName || user.username}</h1>
//           <button
//             onClick={handleLogout}
//             className="text-red-600 hover:text-red-800 font-medium"
//           >
//             Đăng xuất
//           </button>
//         </div>

//         {/* Balance Section */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg text-center">
//             <p className="text-sm text-gray-600">Vàng nạp từ web</p>
//             <p className="text-xl font-bold text-yellow-700">{formatNumber(vangNapTuWeb)}</p>
//           </div>
//           <div className="bg-purple-50 border border-purple-300 p-4 rounded-lg text-center">
//             <p className="text-sm text-gray-600">Ngọc nạp từ web</p>
//             <p className="text-xl font-bold text-purple-700">{formatNumber(ngocNapTuWeb)}</p>
//           </div>
//           <div className="bg-green-50 border border-green-300 p-4 rounded-lg text-center">
//             <p className="text-sm text-gray-600">Số dư hiện tại</p>
//             <p className="text-xl font-bold text-green-700">{formatCurrency(currentBalance)}</p>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex flex-wrap gap-3 mb-6">
//           <button
//             onClick={() => { setDepositType('vang'); setShowDepositModal(true); }}
//             disabled={loading}
//             className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
//           >
//             Nạp Vàng
//           </button>
//           <button
//             onClick={() => { setDepositType('ngoc'); setShowDepositModal(true); }}
//             disabled={loading}
//             className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
//           >
//             Nạp Ngọc
//           </button>
//           <button
//             onClick={loadBalance}
//             disabled={loading}
//             className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
//           >
//             Làm mới
//           </button>
//         </div>

//       </div>

//       {/* Deposit Modal */}
//       {showDepositModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
//             <h2 className="text-lg font-semibold mb-4">
//               Nạp {depositType === 'vang' ? 'Vàng' : 'Ngọc'}
//             </h2>
//             <input
//               type="number"
//               value={depositAmount}
//               onChange={(e) => setDepositAmount(e.target.value)}
//               placeholder={`Nhập số ${depositType === 'vang' ? 'vàng' : 'ngọc'} muốn nạp`}
//               className="w-full border rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring focus:ring-yellow-300"
//             />
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowDepositModal(false)}
//                 className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
//               >
//                 Hủy
//               </button>
//               <button
//                 onClick={handleDeposit}
//                 disabled={loading}
//                 className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md disabled:opacity-50"
//               >
//                 {loading ? 'Đang xử lý...' : 'Xác nhận'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default User;
