import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
// LƯU Ý: Điều chỉnh đường dẫn import này trỏ đúng vào file page.tsx của bạn
import AccHistory from '../app/(main)/acchistory/page';

// --- 1. SETUP MOCKS (Giả lập môi trường) ---

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock alert
global.alert = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key: string) => { delete store[key]; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.clipboard (Vì JSDOM không có cái này)
Object.assign(navigator, {
    clipboard: {
        writeText: jest.fn(),
    },
});

// --- 2. DATA GIẢ LẬP ---
const mockUser = JSON.stringify({ access_token: 'fake-token-123' });
const mockData = {
    accounts: [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', password: 'pass2' },
    ],
};

// --- 3. TEST SUITE ---
describe('AccHistory Component', () => {

    // Reset mọi mock trước mỗi test case để đảm bảo sạch sẽ
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('hien thi loading khi moi vao', () => {
        localStorageMock.setItem('currentUser', mockUser);
        render(<AccHistory />);
        expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
    });

    it('hien thi alert neu chua dang nhap (khong co localStorage)', async () => {
        render(<AccHistory />);

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Vui lòng đăng nhập!');
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    it('hien thi danh sach tai khoan khi API tra ve thanh cong', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock API trả về data thành công
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        });

        render(<AccHistory />);

        await waitFor(() => {
            // Kiểm tra username user1 xuất hiện
            expect(screen.getByText('user1')).toBeInTheDocument();
            // Kiểm tra password pass1 xuất hiện
            expect(screen.getByText('pass1')).toBeInTheDocument();
            // Kiểm tra số lượng dòng
            expect(screen.getAllByRole('row')).toHaveLength(3); // 1 header + 2 data rows
        });
    });

    it('hien thi thong bao trong khi khong co tai khoan', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock API trả về danh sách rỗng
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ accounts: [] }),
        });

        render(<AccHistory />);

        await waitFor(() => {
            expect(screen.getByText('Chưa có tài khoản nào')).toBeInTheDocument();
        });
    });

    it('hien thi loi khi API that bai', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock API lỗi 500
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        render(<AccHistory />);

        await waitFor(() => {
            expect(screen.getByText('HTTP error! status: 500')).toBeInTheDocument();
            expect(screen.getByText('Thử lại')).toBeInTheDocument();
        });
    });

    it('copy vao clipboard khi nhan nut sao chep', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData,
        });

        render(<AccHistory />);

        // Chờ data load xong
        await waitFor(() => expect(screen.getByText('user1')).toBeInTheDocument());

        // Tìm nút "Sao chép" đầu tiên và click
        const copyBtns = screen.getAllByText('Sao chép');
        fireEvent.click(copyBtns[0]);

        // Kiểm tra hàm writeText đã được gọi đúng format chưa
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            `Username: user1\nPassword: pass1`
        );
        expect(window.alert).toHaveBeenCalledWith('Đã sao chép!');
    });

    it('nut lam moi (refresh) goi lai API', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        // Setup cho lần gọi đầu tiên
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });
        // Setup cho lần gọi thứ hai (khi bấm nút)
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

        render(<AccHistory />);

        await waitFor(() => expect(screen.getByText('Làm mới')).toBeInTheDocument());

        // Click nút làm mới
        fireEvent.click(screen.getByText('Làm mới'));

        // Kiểm tra fetch được gọi 2 lần (1 lần mount, 1 lần click)
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });
});