import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePassword from '../app/(main)/change-password/page';

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
const mockUser = JSON.stringify({ access_token: 'fake-token-123' });

describe('ChangePassword Page', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        jest.useFakeTimers(); // Bật đồng hồ giả để test setTimeout
    });

    afterEach(() => {
        jest.useRealTimers(); // Trả lại đồng hồ thật
    });

    it('render giao dien day du cac input va button', () => {
        render(<ChangePassword />);
        expect(screen.getByText('Đổi Mật Khẩu')).toBeInTheDocument();
        expect(screen.getByLabelText(/Mật khẩu cũ/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Mật khẩu mới/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Đổi mật khẩu/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Quay lại/ })).toBeInTheDocument();
    });

    it('bao loi validation khi bo trong input', () => {
        render(<ChangePassword />);

        fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/ }));

        expect(screen.getByText('Vui lòng điền đầy đủ thông tin!')).toBeInTheDocument();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('bao loi khi mat khau moi qua ngan', () => {
        render(<ChangePassword />);

        fireEvent.change(screen.getByLabelText(/Mật khẩu cũ/), { target: { value: 'oldPass' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu mới/), { target: { value: '123' } }); // < 6 ký tự

        fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/ }));

        expect(screen.getByText('Mật khẩu mới phải có ít nhất 6 ký tự!')).toBeInTheDocument();
    });

    it('bao loi khi mat khau moi trung mat khau cu', () => {
        render(<ChangePassword />);

        fireEvent.change(screen.getByLabelText(/Mật khẩu cũ/), { target: { value: 'samePass' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu mới/), { target: { value: 'samePass' } });

        fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/ }));

        expect(screen.getByText('Mật khẩu mới phải khác mật khẩu cũ!')).toBeInTheDocument();
    });

    it('chuyen huong ve login neu chua dang nhap (localStorage trong)', () => {
        render(<ChangePassword />);

        fireEvent.change(screen.getByLabelText(/Mật khẩu cũ/), { target: { value: 'oldPass' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu mới/), { target: { value: 'newPass' } });

        fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/ }));

        expect(screen.getByText('Vui lòng đăng nhập!')).toBeInTheDocument();
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('goi API thanh cong, hien thong bao va redirect sau 2 giay', async () => {
        // Setup
        localStorageMock.setItem('currentUser', mockUser);
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });

        render(<ChangePassword />);

        // Action
        fireEvent.change(screen.getByLabelText(/Mật khẩu cũ/), { target: { value: 'oldPass' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu mới/), { target: { value: 'newPass' } });
        fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/ }));

        // Assert API Call
        expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/change-password', expect.objectContaining({
                method: 'PATCH',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer fake-token-123'
                }),
                body: JSON.stringify({ oldPassword: 'oldPass', newPassword: 'newPass' })
            }));
        });

        // Assert Success Message
        expect(screen.getByText('Đổi mật khẩu thành công!')).toBeInTheDocument();

        // Assert Timeout Redirect (Tua nhanh thời gian 2s)
        act(() => {
            jest.advanceTimersByTime(2000);
        });

        expect(localStorageMock.getItem('currentUser')).toBeNull(); // Token đã bị xóa
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('hien thi loi tu API tra ve', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        mockFetch.mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Mật khẩu sai rồi' }),
        });

        render(<ChangePassword />);

        fireEvent.change(screen.getByLabelText(/Mật khẩu cũ/), { target: { value: 'wrongPass' } });
        fireEvent.change(screen.getByLabelText(/Mật khẩu mới/), { target: { value: 'newPass' } });
        fireEvent.click(screen.getByRole('button', { name: /Đổi mật khẩu/ }));

        await waitFor(() => {
            expect(screen.getByText('Mật khẩu sai rồi')).toBeInTheDocument();
        });
    });

    it('nut quay lai chuyen huong ve trang user', () => {
        render(<ChangePassword />);
        fireEvent.click(screen.getByRole('button', { name: /Quay lại/ }));
        expect(mockPush).toHaveBeenCalledWith('/user');
    });
});