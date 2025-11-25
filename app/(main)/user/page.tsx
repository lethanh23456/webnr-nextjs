"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserData {
  danhSachVatPhamWeb: any[];
  id: number;
  vang: { low: number; high: number; unsigned: boolean };
  ngoc: { low: number; high: number; unsigned: boolean };
  sucManh: { low: number; high: number; unsigned: boolean };
  vangNapTuWeb: { low: number; high: number; unsigned: boolean };
  ngocNapTuWeb: { low: number; high: number; unsigned: boolean };
  x: number;
  y: number;
  mapHienTai: string;
  daVaoTaiKhoanLanDau: boolean;
  coDeTu: boolean;
  auth_id: number;
}

interface ApiResponse {
  user: UserData;
}

export default function User() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
 

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const refreshAccessToken = async (refreshToken: string) => {
    const res = await fetch("/api/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json();
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    currentUser.access_token = data.access_token;
    currentUser.refresh_token = data.refresh_token;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    return data.access_token;
  };

  const fetchUserProfile = async (isRetry = false) => {
    setLoading(true);
   

    const stored = localStorage.getItem("currentUser");
    if (!stored) {

      router.push("/login");
      return;
    }

    const userData = JSON.parse(stored);
    const authId = userData.auth_id;
    let accessToken = userData.access_token;
    const refreshToken = userData.refresh_token;

    const res = await fetch(`/api/profile/${authId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401 && !isRetry && refreshToken) {
      accessToken = await refreshAccessToken(refreshToken);
      return fetchUserProfile(true);
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      return;
    }

    const data: ApiResponse = await res.json();
    if (data.user) setUser(data.user);

    setLoading(false);
  };

  const formatNumber = (v: { low: number }) => v.low.toLocaleString();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-b-2 border-blue-500 mx-auto rounded-full"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600">
        Không tìm thấy thông tin người dùng
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Thông tin nhân vật
            </h1>
            <p className="text-gray-500 mt-1">
              ID: {user.id} | Auth ID: {user.auth_id}
            </p>
          </div>
           <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => router.push("/acchistory")} 
          >
            lịch sử mua acc
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => router.push("/pay")} 
          >
            tài khoản
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => router.push("/login")} 
          >
            đăng xuất
          </button>
          <button
            onClick={() => fetchUserProfile()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            Làm mới
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-yellow-100">Vàng</p>
            <p className="text-3xl font-bold">{formatNumber(user.vang)}</p>
            <p className="text-xs text-yellow-100 mt-1">
              Nạp từ web: {formatNumber(user.vangNapTuWeb)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-purple-100">Ngọc</p>
            <p className="text-3xl font-bold">{formatNumber(user.ngoc)}</p>
            <p className="text-xs text-purple-100 mt-1">
              Nạp từ web: {formatNumber(user.ngocNapTuWeb)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-400 to-red-600 text-white rounded-lg shadow-lg p-6">
            <p className="text-sm text-red-100">Sức mạnh</p>
            <p className="text-3xl font-bold">{formatNumber(user.sucManh)}</p>
          </div>
        </div>

        {/* Location & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📍 Vị trí</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Map hiện tại:</span>
                <span className="font-semibold">{user.mapHienTai}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tọa độ X:</span>
                <span className="font-semibold">{user.x}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tọa độ Y:</span>
                <span className="font-semibold">{user.y}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">ℹ️ Trạng thái</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Đã vào lần đầu:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.daVaoTaiKhoanLanDau
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.daVaoTaiKhoanLanDau ? "Rồi" : "Chưa"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Có đệ tử:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    user.coDeTu
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {user.coDeTu ? "Có" : "Không"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vật phẩm web:</span>
                <span className="font-semibold">
                  {user.danhSachVatPhamWeb.length}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
