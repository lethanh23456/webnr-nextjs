"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PayData {
  id: number;
  userId: number;
  tien: string;
  status: string;
  updatedAt: string;
}

interface PayResponse {
  pay: PayData;
  message: string;
}

interface QRResponse {
  qr: string;
  username: string;
}

export default function Pay() {
  const router = useRouter();
  const [payData, setPayData] = useState<PayData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // QR Modal states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrData, setQrData] = useState<QRResponse | null>(null);
  const [qrError, setQrError] = useState("");
  const [amount, setAmount] = useState("50000");
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetchPayData();
    // Lấy username từ localStorage
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      const userData = JSON.parse(stored);
      setUsername(userData.username || "");
    }
  }, []);

  const fetchPayData = async () => {
    try {
      setLoading(true);
      setError("");

      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        setError("Không tìm thấy thông tin đăng nhập");
        router.push("/login");
        return;
      }

      const userData = JSON.parse(stored);
      const accessToken = userData.access_token;
      const authId = userData.auth_id;

      console.log("📝 Fetching pay data for user:", authId);

      const response = await fetch(`/api/pay?userId=${authId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("📡 Response status:", response.status);

      const responseText = await response.text();
      let data: PayResponse;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError);
        throw new Error("Server returned invalid JSON");
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log("✅ Pay data:", data);
      setPayData(data.pay);
      setMessage(data.message);

    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  const generateQR = async () => {
    try {
      setQrLoading(true);
      setQrError("");
      setQrData(null);

      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        router.push("/login");
        return;
      }

      const userData = JSON.parse(stored);
      const accessToken = userData.access_token;
      const authId = userData.auth_id;

      console.log("📝 Generating QR for user:", authId);

      const response = await fetch(
        `/api/qr?userId=${authId}&amount=${amount}&username=${username}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi tạo mã QR");
      }

      console.log("✅ QR generated:", data);
      setQrData(data);
    } catch (err) {
      console.error("❌ QR error:", err);
      setQrError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setQrLoading(false);
    }
  };

  const openQRModal = () => {
    setShowQRModal(true);
    setQrData(null);
    setQrError("");
    setAmount("50000");
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setQrData(null);
    setQrError("");
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseInt(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin ví...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
          <div className="text-red-500 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Lỗi</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => fetchPayData()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded mt-4"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-600">Không tìm thấy thông tin ví</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Ví của tôi</h1>
              {message && (
                <p className="text-green-600 mt-1 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {message}
                </p>
              )}
            </div>
            <button
              onClick={() => fetchPayData()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-2">Số dư hiện tại</p>
              <p className="text-4xl font-bold">{formatCurrency(payData.tien)}</p>
            </div>
            <div className="text-6xl opacity-50">💰</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={openQRModal}
            className="bg-white hover:bg-gray-50 border-2 border-blue-500 text-blue-500 font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nạp tiền
          </button>
          <button className="bg-white hover:bg-gray-50 border-2 border-red-500 text-red-500 font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
            Rút tiền
          </button>
        </div>

        {/* QR Modal */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Nạp tiền qua QR</h2>
                <button
                  onClick={closeQRModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {!qrData ? (
                  // Form to generate QR
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Tên tài khoản
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập tên tài khoản"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Số tiền (VND)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập số tiền"
                        min="1000"
                        step="1000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {formatCurrency(amount)}
                      </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {["10000", "50000", "100000", "200000", "500000", "1000000"].map(
                        (value) => (
                          <button
                            key={value}
                            onClick={() => setAmount(value)}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium transition ${
                              amount === value
                                ? "bg-blue-500 text-white border-blue-500"
                                : "border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {parseInt(value).toLocaleString("vi-VN")}đ
                          </button>
                        )
                      )}
                    </div>

                    {qrError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm">{qrError}</p>
                      </div>
                    )}

                    <button
                      onClick={generateQR}
                      disabled={qrLoading || !username || !amount}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      {qrLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          Tạo mã QR
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Display QR Code
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-bold text-green-600 flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Mã QR đã tạo thành công!
                    </h3>

                    <div className="bg-white p-4 rounded-lg border-2 border-blue-200 inline-block">
                      <img
                        src={qrData.qr}
                        alt="QR Code"
                        className="w-full max-w-sm mx-auto"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          setQrError('Không thể tải mã QR');
                        }}
                      />
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-gray-600 text-sm">Thông tin thanh toán:</p>
                      <p className="text-gray-800 font-semibold mt-1">
                        Tài khoản: <span className="text-blue-600">{qrData.username}</span>
                      </p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {formatCurrency(amount)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setQrData(null)}
                        className="flex-1 text-blue-500 hover:text-blue-600 font-medium px-4 py-2 border-2 border-blue-500 rounded-lg transition"
                      >
                        Tạo mã mới
                      </button>
                      <a
                        href={qrData.qr}
                        download="qr-payment.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-green-500 hover:text-green-600 font-medium px-4 py-2 border-2 border-green-500 rounded-lg transition text-center"
                      >
                        Tải xuống
                      </a>
                    </div>

                    <p className="text-xs text-gray-500">
                      Quét mã QR bằng ứng dụng ngân hàng để nạp tiền
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}