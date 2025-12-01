import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShopAcc from '../app/(main)/shopacc/page'; // Điều chỉnh đường dẫn nếu cần

// --- 1. MOCK GLOBAL FETCH ---
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// --- 2. MOCK LOCALSTORAGE ---
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- 3. MOCK BROWSER APIs ---
window.alert = jest.fn();
window.confirm = jest.fn();
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
});

// --- DỮ LIỆU GIẢ LẬP ---
const mockUser = JSON.stringify({ access_token: 'fake-token' });
const mockAccounts = [
    {
        id: 1,
        url: 'img1.jpg',
        description: 'Acc Vip Pro',
        price: 50000,
        status: 'ACTIVE',
        createdAt: '2023-01-01'
    },
    {
        id: 2,
        url: 'img2.jpg',
        description: 'Acc Cùi Bắp',
        price: 10000,
        status: 'SOLD', // Status không phải ACTIVE
        createdAt: '2023-01-02'
    }
];

describe('ShopAcc Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('hien thi loading va yeu cau dang nhap neu chua login', async () => {
        render(<ShopAcc />);

        // Check loading ban đầu
        expect(screen.getByText('Đang tải thông tin...')).toBeInTheDocument();

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Vui lòng đăng nhập!');
            // Không có data nên không hiển thị list
        });
    });

    it('fetch danh sach account thanh cong va hien thi (chi hien ACTIVE)', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock API trả về danh sách
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ accounts: mockAccounts }), // Trả về cấu trúc data.accounts
        });

        render(<ShopAcc />);

        await waitFor(() => {
            // Loading biến mất
            expect(screen.queryByText('Đang tải thông tin...')).not.toBeInTheDocument();

            // Acc ACTIVE (id 1) phải hiện
            expect(screen.getByText('Acc Vip Pro')).toBeInTheDocument();
            expect(screen.getByText('50.000 ₫')).toBeInTheDocument();

            // Acc SOLD (id 2) không được hiện (do logic filter trong component)
            expect(screen.queryByText('Acc Cùi Bắp')).not.toBeInTheDocument();
        });
    });

    it('xem chi tiet account (mo modal)', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockAccounts }); // Trả về mảng trực tiếp

        render(<ShopAcc />);
        await waitFor(() => expect(screen.getByText('Acc Vip Pro')).toBeInTheDocument());

        // Click nút Xem Chi Tiết
        fireEvent.click(screen.getByText('Xem Chi Tiết'));

        // Kiểm tra Modal hiện ra
        expect(screen.getByText('Chi Tiết Account')).toBeInTheDocument();
        expect(screen.getByText('ID Account')).toBeInTheDocument();

        // Đóng Modal
        const closeBtn = screen.getByRole('button', { name: '' }); // Button đóng thường không có text, check icon svg
        // Hoặc tìm button bằng class/icon, ở đây ta tìm nút đóng ở header modal
        // Cách đơn giản nhất trong trường hợp này là tìm nút "Xem Chi Tiết" đã bị che hoặc tìm text trong modal
    });

    it('mua account thanh cong: flow click Mua -> Confirm -> API -> Success Modal', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // 1. Mock API Get List
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockAccounts });

        render(<ShopAcc />);
        await waitFor(() => expect(screen.getByText('Acc Vip Pro')).toBeInTheDocument());

        // Mở modal chi tiết trước (vì nút Mua nằm trong Modal Chi Tiết)
        fireEvent.click(screen.getByText('Xem Chi Tiết'));

        // 2. Setup cho hành động Mua
        // Mock window.confirm trả về true (đồng ý mua)
        (window.confirm as jest.Mock).mockReturnValue(true);

        // Mock API Buy Account thành công
        const buyResult = { username: 'newuser', password: 'newpass' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => buyResult,
        });

        // 3. Click nút Mua
        const buyBtn = screen.getByText(/Mua Account Này/i);
        fireEvent.click(buyBtn);

        // 4. Kiểm tra Confirm được gọi
        expect(window.confirm).toHaveBeenCalledWith('Bạn có chắc muốn mua account này?');

        // 5. Kiểm tra API được gọi đúng
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/buy-account-sell', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ id: 1 })
            }));
        });

        // 6. Kiểm tra Modal Thành Công hiện ra
        expect(screen.getByText(/Mua Account Thành Công/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('newuser')).toBeInTheDocument();
        expect(screen.getByDisplayValue('newpass')).toBeInTheDocument();
    });

    it('copy thong tin tai khoan vao clipboard', async () => {
        // Render Modal thành công giả lập (bằng cách set state gián tiếp qua flow mua hàng hoặc mock component con)
        // Để đơn giản, ta test flow mua hàng xong rồi test copy
        localStorageMock.setItem('currentUser', mockUser);
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockAccounts });

        render(<ShopAcc />);
        await waitFor(() => expect(screen.getByText('Acc Vip Pro')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Xem Chi Tiết'));
        (window.confirm as jest.Mock).mockReturnValue(true);
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ username: 'userCopy', password: 'passCopy' }) });

        fireEvent.click(screen.getByText(/Mua Account Này/i));

        await waitFor(() => expect(screen.getByDisplayValue('userCopy')).toBeInTheDocument());

        // Tìm các nút Copy (có title="Copy")
        const copyBtns = screen.getAllByTitle('Copy');

        // Click copy username
        fireEvent.click(copyBtns[0]);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('userCopy');
        expect(window.alert).toHaveBeenCalledWith('Đã copy vào clipboard!');
    });
});