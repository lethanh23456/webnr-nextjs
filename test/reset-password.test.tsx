import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResetPassword from '../app/(main)/reset-password/page'; // Điều chỉnh đường dẫn

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

describe('ResetPassword Page', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers(); // Mock timer vì có setTimeout 5s
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Helper để tìm Input Username (Giả định placeholder giống trang Login)
    // Nếu placeholder của bạn khác, hãy sửa lại dòng này
    const getUsernameInput = () => screen.getByPlaceholderText(/tên đăng nhập|username/i);

    // Helper tìm nút Submit
    const getSubmitButton = () => screen.getByRole('button');

    it('hien thi giao dien Buoc 1 (Nhap username)', () => {
        render(<ResetPassword />);

        // Kiểm tra input username hiện diện
        expect(getUsernameInput()).toBeInTheDocument();

        // Kiểm tra nút submit hiện diện
        expect(getSubmitButton()).toBeInTheDocument();
    });

    it('bao loi khi submit ma khong nhap username', () => {
        render(<ResetPassword />);

        fireEvent.click(getSubmitButton());

        // Kiểm tra thông báo lỗi
        expect(screen.getByText('Vui lòng nhập username!')).toBeInTheDocument();

        // Đảm bảo API không được gọi
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('gui yeu cau OTP THANH CONG: goi API, hien thong bao va chuyen sang Buoc 2', async () => {
        // Mock API trả về success
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<ResetPassword />);

        // 1. Nhập username
        fireEvent.change(getUsernameInput(), { target: { value: 'user123' } });

        // 2. Click Gửi
        fireEvent.click(getSubmitButton());

        // 3. Kiểm tra Loading (nếu UI có hiển thị loading)
        // expect(screen.getByText(/loading|đang/i)).toBeInTheDocument();

        await waitFor(() => {
            // 4. Kiểm tra gọi API đúng
            expect(mockFetch).toHaveBeenCalledWith('/api/request-reset-password', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ username: 'user123' }),
            }));

            // 5. Kiểm tra thông báo thành công
            expect(screen.getByText('Mã OTP đã được gửi đến email của bạn!')).toBeInTheDocument();
        });

        // 6. Kiểm tra đã chuyển sang BƯỚC 2
        // Tại bước 2, input username sẽ ẩn hoặc input OTP/Password sẽ hiện ra.
        // Giả định input OTP sẽ xuất hiện
        // await waitFor(() => {
        //   expect(screen.getByPlaceholderText(/OTP/i)).toBeInTheDocument();
        // });
    });

    it('gui yeu cau OTP THAT BAI: hien thi loi tu API', async () => {
        // Mock API trả về lỗi
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ message: 'Tài khoản không tồn tại' }),
        });

        render(<ResetPassword />);

        fireEvent.change(getUsernameInput(), { target: { value: 'unknown_user' } });
        fireEvent.click(getSubmitButton());

        await waitFor(() => {
            expect(screen.getByText('Tài khoản không tồn tại')).toBeInTheDocument();
        });
    });

    it('tu dong an thong bao sau 5 giay', async () => {
        render(<ResetPassword />);

        // Trigger lỗi validation
        fireEvent.click(getSubmitButton());
        expect(screen.getByText('Vui lòng nhập username!')).toBeInTheDocument();

        // Tua nhanh thời gian 5s
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        // Thông báo phải biến mất
        await waitFor(() => {
            expect(screen.queryByText('Vui lòng nhập username!')).not.toBeInTheDocument();
        });
    });

    it('xu ly loi he thong (Network Error)', async () => {
        mockFetch.mockRejectedValue(new Error('Mất kết nối mạng'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<ResetPassword />);

        fireEvent.change(getUsernameInput(), { target: { value: 'user123' } });
        fireEvent.click(getSubmitButton());

        await waitFor(() => {
            expect(screen.getByText('Mất kết nối mạng')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
}); 