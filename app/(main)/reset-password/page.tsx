"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1); // Bước 1: Request OTP, Bước 2: Reset Password
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // Bước 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      showMessage("Vui lòng nhập username!", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/request-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage(
          "Mã OTP đã được gửi đến email của bạn!",
          "success"
        );
        setStep(2); // Chuyển sang bước 2
      } else {
        throw new Error(data.error || data.message || "Không thể gửi OTP");
      }
    } catch (error: any) {
      console.error("Error:", error);
      showMessage(error.message || "Có lỗi xảy ra khi gửi OTP!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Reset Password với OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      showMessage("Vui lòng điền đầy đủ thông tin!", "error");
      return;
    }

    if (formData.newPassword.length < 6) {
      showMessage("Mật khẩu mới phải có ít nhất 6 ký tự!", "error");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showMessage("Mật khẩu xác nhận không khớp!", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage(
          "Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...",
          "success"
        );

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        throw new Error(data.error || data.message || "Không thể đặt lại mật khẩu");
      }
    } catch (error: any) {
      console.error("Error:", error);
      showMessage(
        error.message || "Có lỗi xảy ra khi đặt lại mật khẩu!",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 1 ? "Quên Mật Khẩu" : "Đặt Lại Mật Khẩu"}
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 1
              ? "Nhập username để nhận mã OTP"
              : "Nhập mã OTP và mật khẩu mới"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 1
                ? "bg-blue-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            1
          </div>
          <div className="w-16 h-1 bg-gray-300">
            <div
              className={`h-full bg-blue-600 transition-all duration-300 ${
                step === 2 ? "w-full" : "w-0"
              }`}
            ></div>
          </div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              step === 2
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            2
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Step 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="mt-8 space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập username của bạn"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang gửi...
                  </span>
                ) : (
                  "Gửi mã OTP"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Quay lại
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Reset Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
            <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
              {/* Username (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* OTP */}
              <div>
                <label
                  htmlFor="otp"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mã OTP <span className="text-red-500">*</span>
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mã OTP (6 chữ số)"
                  maxLength={6}
                />
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  "Đặt lại mật khẩu"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Quay lại
              </button>
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData({ otp: "", newPassword: "", confirmPassword: "" });
                }}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Không nhận được mã? Gửi lại OTP
              </button>
            </div>
          </form>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Lưu ý:</strong>{" "}
            {step === 1
              ? "Mã OTP sẽ được gửi đến email liên kết với username của bạn và có hiệu lực trong 10 phút."
              : "Sau khi đặt lại mật khẩu thành công, bạn sẽ được chuyển đến trang đăng nhập."}
          </p>
        </div>
      </div>
    </div>
  );
}