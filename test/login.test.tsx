import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Login from '../app/(main)/login/page'; // Điều chỉnh đường dẫn theo dự án của bạn

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

// --- 3. MOCK LOCALSTORAGE ---
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

// --- 4. MOCK ALERT ---
// Vì component dùng alert(), ta cần mock nó để test không bị lỗi và kiểm tra nội dung
window.alert = jest.fn();

describe('Login Page', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('hien thi day du form dang nhap', () => {
        render(<Login />);

        expect(screen.getByRole('heading', { name: /Đăng Nhập/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập tên đăng nhập')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeInTheDocument();
    });

    it('cho phep nhap username va password', () => {
        render(<Login />);

        const userInput = screen.getByPlaceholderText('Nhập tên đăng nhập');
        const passInput = screen.getByPlaceholderText('Nhập mật khẩu');

        fireEvent.change(userInput, { target: { value: 'myUser' } });
        fireEvent.change(passInput, { target: { value: 'myPass' } });

        expect(userInput).toHaveValue('myUser');
        expect(passInput).toHaveValue('myPass');
    });

    it('dang nhap THANH CONG: goi API, luu localstorage, alert va chuyen huong', async () => {
        // Setup API trả về thành công
        const mockResponseData = { id: 1, name: 'Test User', token: 'abc' };
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => mockResponseData,
        });

        render(<Login />);

        // Nhập liệu
        fireEvent.change(screen.getByPlaceholderText('Nhập tên đăng nhập'), { target: { value: 'validUser' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'validPass' } });

        // Submit
        const submitBtn = screen.getByRole('button', { name: 'Đăng nhập' });
        fireEvent.click(submitBtn);

        // Assert Loading State (nút chuyển sang "Đang đăng nhập...")
        expect(screen.getByText('Đang đăng nhập...')).toBeInTheDocument();

        await waitFor(() => {
            // 1. Kiểm tra gọi fetch
            expect(mockFetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ username: 'validUser', password: 'validPass' })
            }));

            // 2. Kiểm tra lưu localStorage
            const stored = localStorageMock.getItem('currentUser');
            expect(stored).toEqual(JSON.stringify(mockResponseData));

            // 3. Kiểm tra Alert
            expect(window.alert).toHaveBeenCalledWith('Đăng nhập thành công!');

            // 4. Kiểm tra chuyển hướng
            expect(mockPush).toHaveBeenCalledWith('/otp');
        });
    });

    it('dang nhap THAT BAI (Sai tai khoan/mat khau - 401)', async () => {
        // Setup API trả về lỗi 401
        mockFetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: async () => ({ message: 'Unauthorized' }),
        });

        render(<Login />);

        fireEvent.change(screen.getByPlaceholderText('Nhập tên đăng nhập'), { target: { value: 'wrongUser' } });
        fireEvent.change(screen.getByPlaceholderText('Nhập mật khẩu'), { target: { value: 'wrongPass' } });
        fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => {
            // 1. Kiểm tra Alert đúng nội dung
            expect(window.alert).toHaveBeenCalledWith('Tài khoản hoặc mật khẩu không đúng!');

            // 2. Kiểm tra form bị reset (rỗng)
            expect(screen.getByPlaceholderText('Nhập tên đăng nhập')).toHaveValue('');
            expect(screen.getByPlaceholderText('Nhập mật khẩu')).toHaveValue('');

            // 3. Không chuyển hướng
            expect(mockPush).not.toHaveBeenCalled();
        });
    });

    it('dang nhap THAT BAI (Loi khac - 500)', async () => {
        // Setup API trả về lỗi custom
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Lỗi server nội bộ' }),
        });

        render(<Login />);

        fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Lỗi server nội bộ');
            // Form reset
            expect(screen.getByPlaceholderText('Nhập tên đăng nhập')).toHaveValue('');
        });
    });

    it('cac lien ket chuyen trang hoat dong dung', () => {
        render(<Login />);

        // 1. Test nút "Đăng ký ngay"
        fireEvent.click(screen.getByText('Đăng ký ngay'));
        expect(mockPush).toHaveBeenCalledWith('/register');

        // 2. Test nút "Quên mật khẩu?"
        fireEvent.click(screen.getByText('Quên mật khẩu?'));
        expect(mockPush).toHaveBeenCalledWith('/reset-password');

        // 3. Test nút "Quay về trang chủ"
        fireEvent.click(screen.getByText('Quay về trang chủ'));
        expect(mockPush).toHaveBeenCalledWith('/');
    });
});