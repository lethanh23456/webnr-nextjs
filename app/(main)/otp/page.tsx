"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { json } from "stream/consumers";

interface FormData {
  otp: string;
}

function Otp() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({ otp: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Lấy sessionId từ localStorage
      const stored = localStorage.getItem("currentUser");
      const sessionId = stored ? JSON.parse(stored).sessionId : null;
      console.log("🔍 Retrieved sessionId:", sessionId);

      if (!sessionId) {
        alert("Không tìm thấy sessionId. Vui lòng đăng nhập lại!");
        return;
      }

      
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            otp: formData.otp,
            sessionId: sessionId,
        }),
      });

      const data = await response.json();
      console.log("Verify OTP response:", data);
      
      const dataold = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (response.ok) {
          const userData = {
          ...dataold,
          ...data,
        };
       localStorage.setItem('currentUser', JSON.stringify(userData));
        alert("✅ Nhập OTP thành công!");
        router.push("/"); 
      } else {
        const message =
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Xác thực OTP thất bại!";
        alert(message);
      }
    } catch (error) {
      console.error("❌ Lỗi khi verify OTP:", error);
      alert("Đã xảy ra lỗi không mong đợi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/br.jpg')" }}
    >
      <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(124,58,237,0.3)] rounded-3xl p-8 w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-[2rem] font-extrabold text-transparent bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 bg-clip-text">
            Nhập OTP
          </h2>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <input
            type="text"
            name="otp"
            placeholder="Nhập mã OTP"
            value={formData.otp}
            onChange={handleInputChange}
            disabled={loading}
            required
            className="w-full h-14 px-4 bg-white/[0.08] border rounded-2xl text-white focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-2xl font-semibold transition-all disabled:opacity-60"
          >
            {loading ? "Đang xác thực..." : "Xác nhận OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Otp;
