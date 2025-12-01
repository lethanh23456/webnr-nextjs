import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import User from '../app/(main)/user/page'; // Điều chỉnh đường dẫn nếu cần

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
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- DATA GIẢ LẬP ---
const mockLocalStorageUser = JSON.stringify({
    auth_id: 99,
    access_token: 'old-token',
    refresh_token: 'valid-refresh-token'
});

const mockUserProfile = {
    user: {
        id: 12345,
        auth_id: 99,
        vang: { low: 1000000, high: 0, unsigned: false },
        ngoc: { low: 500, high: 0, unsigned: false },
        sucManh: { low: 20000000, high: 0, unsigned: false },
        vangNapTuWeb: { low: 50000, high: 0 },
        ngocNapTuWeb: { low: 100, high: 0 },
        danhSachVatPhamWeb: [1, 2],
        x: 100,
        y: 200,
        mapHienTai: 'Làng Aru',
        daVaoTaiKhoanLanDau: true,
        coDeTu: true,
    }
};

describe('User Profile Page', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('chuyen huong ve login neu khong tim thay thong tin trong localStorage', async () => {
        render(<User />);

        // Mặc định loading
        expect(screen.getByText('Đang tải thông tin...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('render thong tin user thanh cong (Happy Path)', async () => {
        // 1. Setup localStorage
        localStorageMock.setItem('currentUser', mockLocalStorageUser);

        // 2. Mock API trả về thành công
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => mockUserProfile,
        });

        render(<User />);

        await waitFor(() => {
            // Loading tắt
            expect(screen.queryByText('Đang tải thông tin...')).not.toBeInTheDocument();

            // Kiểm tra các thông tin chính hiển thị
            expect(screen.getByText('Thông tin nhân vật')).toBeInTheDocument();
            expect(screen.getByText('#12345')).toBeInTheDocument(); // ID nhân vật
            expect(screen.getByText('Làng Aru')).toBeInTheDocument(); // Map

            // Kiểm tra format số tiền (1,000,000)
            expect(screen.getByText('1,000,000')).toBeInTheDocument(); // Vàng
            expect(screen.getByText('500')).toBeInTheDocument(); // Ngọc
            expect(screen.getByText('20,000,000')).toBeInTheDocument(); // Sức mạnh

            // Kiểm tra trạng thái
            expect(screen.getByText('Đã vào')).toBeInTheDocument();
            expect(screen.getByText('Đã có')).toBeInTheDocument();
        });
    });

    it('tu dong refresh token khi gap loi 401 va thu lai API profile', async () => {
        localStorageMock.setItem('currentUser', mockLocalStorageUser);

        // Kịch bản Mock:
        // Call 1: Profile -> Lỗi 401 (Hết hạn)
        // Call 2: Refresh -> Thành công (Trả về token mới)
        // Call 3: Profile (Retry) -> Thành công
        mockFetch
            .mockResolvedValueOnce({ ok: false, status: 401 }) // Call 1
            .mockResolvedValueOnce({ // Call 2: API Refresh
                ok: true,
                json: async () => ({ access_token: 'new-token-123', refresh_token: 'new-refresh-123' })
            })
            .mockResolvedValueOnce({ // Call 3: API Profile retry
                ok: true,
                json: async () => mockUserProfile
            });

        render(<User />);

        await waitFor(() => {
            // Kiểm tra xem đã render data thành công chưa
            expect(screen.getByText('#12345')).toBeInTheDocument();
        });

        // Kiểm tra localStorage đã được cập nhật token mới chưa
        const updatedStorage = JSON.parse(localStorageMock.getItem('currentUser')!);
        expect(updatedStorage.access_token).toBe('new-token-123');
    });

    it('hien thi thong bao khong tim thay neu API loi (khong phai 401)', async () => {
        localStorageMock.setItem('currentUser', mockLocalStorageUser);

        // Mock API lỗi 500 hoặc 404
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({}),
        });

        render(<User />);

        await waitFor(() => {
            expect(screen.getByText('Không tìm thấy thông tin người dùng')).toBeInTheDocument();
        });
    });

    it('chuc nang Dang Xuat hoat dong dung', async () => {
        localStorageMock.setItem('currentUser', mockLocalStorageUser);
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockUserProfile });

        render(<User />);
        await waitFor(() => expect(screen.getByText('#12345')).toBeInTheDocument());

        // Click nút Đăng xuất
        const logoutBtn = screen.getByRole('button', { name: /đăng xuất/i });
        fireEvent.click(logoutBtn);

        // Kiểm tra xóa token và redirect
        expect(localStorageMock.getItem('currentUser')).toBeNull();
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('cac nut dieu huong (Lich su, Shop, Chatbot...) hoat dong dung', async () => {
        localStorageMock.setItem('currentUser', mockLocalStorageUser);
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockUserProfile });

        render(<User />);
        await waitFor(() => expect(screen.getByText('#12345')).toBeInTheDocument());

        // 1. Test nút Lịch sử mua acc
        fireEvent.click(screen.getByRole('button', { name: /Lịch sử mua acc/i }));
        expect(mockPush).toHaveBeenCalledWith('/acchistory');

        // 2. Test nút Shop game
        fireEvent.click(screen.getByRole('button', { name: /shop game/i }));
        expect(mockPush).toHaveBeenCalledWith('/shop');

        // 3. Test nút Đổi mật khẩu
        fireEvent.click(screen.getByRole('button', { name: /đổi mật khẩu/i }));
        expect(mockPush).toHaveBeenCalledWith('/change-password');

        // 4. Test nút Tài khoản (Pay)
        fireEvent.click(screen.getByRole('button', { name: 'Tài khoản' }));
        expect(mockPush).toHaveBeenCalledWith('/pay');
    });
});