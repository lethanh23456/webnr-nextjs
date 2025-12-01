import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Register from '../app/(main)/register/page'; // Điều chỉnh đường dẫn nếu cần

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

describe('Register Page', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('hien thi day du 5 truong input va nut dang ky', () => {
        render(<Register />);

        expect(screen.getByRole('heading', { name: /Đăng Ký/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập tên đăng nhập')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập tên thật')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập lại mật khẩu')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Đăng Ký' })).toBeInTheDocument();
    });

    it('cho phep nhap du lieu vao form', () => {
        render(<Register />);

        const userInput = screen.getByPlaceholderText('Nhập tên đăng nhập');
        const emailInput = screen.getByPlaceholderText('Nhập email');

        fireEvent.change(userInput, { target: { value: 'newuser' } });
        fireEvent.change(emailInput, { target: { value: 'test@mail.com' } });

        expect(userInput).toHaveValue('newuser');
        expect(emailInput).toHaveValue('test@mail.com');
    });

    it('dang ky THANH CONG: goi API dung body, alert, reset form va chuyen huong', async () => {
        // Mock API success
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Success' }),
        });

        render(<Register />);

        // 1. Nhập liệu đầy đủ
        fireEvent.change(screen.getByPlaceholderText('Nhập tên đăng nhập'), { target: { value: 'user1' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập tên thật'), { target: { value: 'Real Name' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập email'), { target: { value: 'u1@test.com' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: '123456' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập lại mật khẩu'), { target: { value: '123456' } });

        // 2. Submit
        fireEvent.click(screen.getByRole('button', { name: 'Đăng Ký' }));

        // 3. Check Loading state
        expect(screen.getByText('Đang đăng ký...')).toBeInTheDocument();

        await waitFor(() => {
            // 4. Check API Call
            expect(mockFetch).toHaveBeenCalledWith('/api/register', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    username: 'user1',
                    realname: 'Real Name',
                    password: '123456',
                    email: 'u1@test.com'
                })
            }));

            // 5. Check Alert
            expect(window.alert).toHaveBeenCalledWith('Đăng ký thành công!');

            // 6. Check Reset Form (Input rỗng)
            expect(screen.getByPlaceholderText('Nhập tên đăng nhập')).toHaveValue('');

            // 7. Check Redirect
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('dang ky THAT BAI: hien thi loi tu API tra ve', async () => {
        // Mock API Error
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Tên tài khoản đã tồn tại' }),
        });

        render(<Register />);

        fireEvent.change(screen.getByPlaceholderText('Nhập tên đăng nhập'), { target: { value: 'existUser' } });
        fireEvent.click(screen.getByRole('button', { name: 'Đăng Ký' }));

        await waitFor(() => {
            // Check Alert hiển thị đúng lỗi từ server
            expect(window.alert).toHaveBeenCalledWith('Tên tài khoản đã tồn tại');
            // Không chuyển hướng
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    it('xu ly loi he thong (catch block)', async () => {
        // Mock Fetch Error
        mockFetch.mockRejectedValue(new Error('Network Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Register />);
        fireEvent.click(screen.getByRole('button', { name: 'Đăng Ký' }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Đã xảy ra lỗi không mong đợi!');
        });

        consoleSpy.mockRestore();
    });

    it('cac nut dieu huong hoat dong dung', () => {
        render(<Register />);

        // 1. Link Đăng nhập
        fireEvent.click(screen.getByText('Đăng nhập ngay'));
        expect(mockPush).toHaveBeenCalledWith('/login');

        // 2. Link Trang chủ
        fireEvent.click(screen.getByText('Quay về trang chủ'));
        expect(mockPush).toHaveBeenCalledWith('/');
    });
});