"use client"
import { useEffect, useState } from "react";

interface Account {
  id: number;
  url: string;
  description: string;
  price: number;
  status: string;
  partner_id: number;
  createdAt: string;
}

interface PurchaseResult {
  username: string;
  password: string;
}

function ShopAcc() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        alert('Vui lòng đăng nhập!');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(stored);
      const response = await fetch('/api/all-account-sell', {
        headers: {
          'Authorization': `Bearer ${userData.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách account');
      }

      const data = await response.json();
      console.log('Data from API:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Handle different response structures
      let accountsList: Account[] = [];
      
      if (Array.isArray(data)) {
        accountsList = data;
      } else if (data.accounts && Array.isArray(data.accounts)) {
        accountsList = data.accounts;
      } else if (data.data && Array.isArray(data.data)) {
        accountsList = data.data;
      } else {
        console.error('Unexpected data structure:', data);
        throw new Error('Dữ liệu từ server không đúng định dạng');
      }
      
      // Filter only ACTIVE accounts
      const activeAccounts = accountsList.filter((acc: Account) => acc.status === 'ACTIVE');
      setAccounts(activeAccounts);
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải danh sách account');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyAccount = async (accountId: number) => {
    if (!confirm('Bạn có chắc muốn mua account này?')) {
      return;
    }

    setPurchasing(accountId);
    setError("");

    try {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        alert('Vui lòng đăng nhập!');
        return;
      }

      const userData = JSON.parse(stored);
      const response = await fetch('/api/buy-account-sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.access_token}`,
        },
        body: JSON.stringify({ id: accountId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể mua account');
      }

      // Show success modal with username and password
      setPurchaseSuccess({
        username: data.username,
        password: data.password,
      });
      setShowModal(true);

      // Remove purchased account from list
      setAccounts(prevAccounts => prevAccounts.filter(acc => acc.id !== accountId));

    } catch (error: any) {
      console.error('Error buying account:', error);
      setError(error.message || 'Có lỗi xảy ra khi mua account');
    } finally {
      setPurchasing(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setPurchaseSuccess(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã copy vào clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop Bán Account</h1>
          <p className="text-gray-600">Chọn và mua account phù hợp với bạn</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Account Grid */}
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Không có account nào</h2>
            <p className="text-gray-500">Hiện tại chưa có account nào để bán</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={account.url}
                    alt={account.description}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200"%3E%3Crect fill="%23e5e7eb" width="300" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2 min-h-[40px]">
                    {account.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Giá</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {account.price.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    ID: #{account.id} • {new Date(account.createdAt).toLocaleDateString('vi-VN')}
                  </p>

                  {/* Buy Button */}
                  <button
                    onClick={() => handleBuyAccount(account.id)}
                    disabled={purchasing === account.id}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      purchasing === account.id
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {purchasing === account.id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang xử lý...
                      </span>
                    ) : (
                      '🛒 Mua Ngay'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success Modal */}
        {showModal && purchaseSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              {/* Success Icon */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Mua Account Thành Công! 🎉</h2>
                <p className="text-gray-600">Thông tin đăng nhập của bạn:</p>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={purchaseSuccess.username}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(purchaseSuccess.username)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Copy"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={purchaseSuccess.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(purchaseSuccess.password)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Copy"
                    >
                      📋
                    </button>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Vui lòng lưu lại thông tin này. Bạn sẽ không thể xem lại sau khi đóng cửa sổ này!
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="w-full py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Đã lưu, đóng cửa sổ
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default ShopAcc;