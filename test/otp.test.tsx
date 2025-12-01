import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Otp from '../app/(main)/otp/page'; // Điều chỉnh đường dẫn nếu cần

// --- 1. MOCK NEXT/NAVIGATION ---
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// --- 2. MOCK FETCH ---
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// --- 3. MOCK ALERT ---
window.alert = jest.fn();

// --- 4. MOCK LOCALSTORAGE ---
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Otp Page', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('hien thi input nhap OTP va nut xac nhan', () => {
        render(<Otp />);
        expect(screen.getByRole('heading', { name: /Nhập OTP/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập mã OTP')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Xác nhận OTP/i })).toBeInTheDocument();
    });

    it('bao loi va khong goi API neu khong co sessionId trong localStorage', () => {
        render(<Otp />);

        // Nhập OTP
        const input = screen.getByPlaceholderText('Nhập mã OTP');
        fireEvent.change(input, { target: { value: '123456' } });

        // Click Submit
        fireEvent.click(screen.getByRole('button', { name: /Xác nhận OTP/i }));

        // Kiểm tra alert
        expect(window.alert).toHaveBeenCalledWith('Không tìm thấy sessionId. Vui lòng đăng nhập lại!');
        // Đảm bảo fetch không được gọi
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('xac thuc OTP THANH CONG: goi API, merge data vao localStorage va chuyen huong', async () => {
        // 1. Setup LocalStorage có sessionId
        const initialUser = { sessionId: 'sess-123', username: 'testuser' };
        localStorageMock.setItem('currentUser', JSON.stringify(initialUser));

        // 2. Mock API trả về thành công (ví dụ trả về access_token mới)
        const apiResponse = { access_token: 'new-token-abc' };
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => apiResponse,
        });

        render(<Otp />);

        // 3. Nhập OTP
        fireEvent.change(screen.getByPlaceholderText('Nhập mã OTP'), { target: { value: '654321' } });
        fireEvent.click(screen.getByRole('button', { name: /Xác nhận OTP/i }));

        // 4. Kiểm tra Loading State
        expect(screen.getByText('Đang xác thực...')).toBeInTheDocument();

        await waitFor(() => {
            // 5. Kiểm tra gọi API
            expect(mockFetch).toHaveBeenCalledWith('/api/verify-otp', expect.objectContaining({
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ otp: '654321', sessionId: 'sess-123' })
            }));

            // 6. Kiểm tra LocalStorage được merge data (dữ liệu cũ + dữ liệu mới từ API)
            const updatedUser = JSON.parse(localStorageMock.getItem('currentUser')!);
            expect(updatedUser).toEqual({
                sessionId: 'sess-123',
                username: 'testuser',
                access_token: 'new-token-abc'
            });

            // 7. Kiểm tra chuyển hướng về trang chủ
            expect(mockPush).toHaveBeenCalledWith('/');
        });
    });

    it('xac thuc OTP THAT BAI: hien thi loi string tu API', async () => {
        // Setup LocalStorage
        localStorageMock.setItem('currentUser', JSON.stringify({ sessionId: 'sess-123' }));

        // Mock API lỗi
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: 'Mã OTP không đúng' }),
        });

        render(<Otp />);

        fireEvent.change(screen.getByPlaceholderText('Nhập mã OTP'), { target: { value: '000000' } });
        fireEvent.click(screen.getByRole('button', { name: /Xác nhận OTP/i }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Mã OTP không đúng');
            // Không chuyển hướng
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    it('xac thuc OTP THAT BAI: hien thi loi array tu API', async () => {
        // Setup LocalStorage
        localStorageMock.setItem('currentUser', JSON.stringify({ sessionId: 'sess-123' }));

        // Mock API lỗi trả về mảng
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: ['OTP quá ngắn', 'OTP không hợp lệ'] }),
        });

        render(<Otp />);

        fireEvent.change(screen.getByPlaceholderText('Nhập mã OTP'), { target: { value: '12' } });
        fireEvent.click(screen.getByRole('button', { name: /Xác nhận OTP/i }));

        await waitFor(() => {
            // Code của bạn dùng .join(", ")
            expect(window.alert).toHaveBeenCalledWith('OTP không hợp lệ');
        });
    });
});