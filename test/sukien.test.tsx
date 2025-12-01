import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sukien from '../app/(main)/sukien/page'; // Điều chỉnh đường dẫn nếu cần

// --- 1. MOCK GLOBAL FETCH ---
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// --- 2. MOCK ALERT ---
window.alert = jest.fn();

// --- 3. MOCK LOCALSTORAGE ---
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// --- DỮ LIỆU GIẢ LẬP ---
const mockUser = JSON.stringify({ access_token: 'fake-token' });
const mockPosts = [
    {
        id: 1,
        title: 'Sự kiện Tết',
        url_anh: 'img1.jpg',
        content: 'Nội dung sự kiện tết',
        editor_id: 1,
        editor_realname: 'Admin',
        status: 'ACTIVE',
        create_at: '2024-01-01'
    },
    {
        id: 2,
        title: 'Đua Top',
        url_anh: 'img2.jpg',
        content: 'Nội dung đua top',
        editor_id: 1,
        editor_realname: 'Mod',
        status: 'ENDED',
        create_at: '2024-02-01'
    }
];

describe('Sukien Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('hien thi loading va alert neu chua dang nhap', async () => {
        render(<Sukien />);

        // Check loading ban đầu
        expect(screen.getByText('Đang tải thông tin...')).toBeInTheDocument();

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Vui lòng đăng nhập!');
            // Không gọi API fetch
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    it('tai danh sach su kien thanh cong va hien thi', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock API trả về danh sách posts
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ posts: mockPosts }),
        });

        render(<Sukien />);

        await waitFor(() => {
            // Loading biến mất
            expect(screen.queryByText('Đang tải thông tin...')).not.toBeInTheDocument();

            // Kiểm tra Header
            expect(screen.getByText('🎉 Sự Kiện')).toBeInTheDocument();
            expect(screen.getByText('Số sự kiện: 2')).toBeInTheDocument();

            // Kiểm tra sự kiện render đúng
            expect(screen.getByText('Sự kiện Tết')).toBeInTheDocument();
            expect(screen.getByText('Đua Top')).toBeInTheDocument();

            // Kiểm tra Editor name
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });
    });

    it('hien thi thong bao khi khong co su kien nao', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock API trả về mảng rỗng
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ posts: [] }),
        });

        render(<Sukien />);

        await waitFor(() => {
            expect(screen.getByText('📭 Chưa có sự kiện nào')).toBeInTheDocument();
        });
    });

    it('mo va dong modal chi tiet su kien', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ posts: mockPosts }),
        });

        render(<Sukien />);

        // Chờ render xong
        await waitFor(() => expect(screen.getByText('Sự kiện Tết')).toBeInTheDocument());

        // 1. Click vào thẻ sự kiện để mở Modal
        // Tìm thẻ div cha chứa tiêu đề (vì onClick gắn ở div cha)
        const postCard = screen.getByText('Sự kiện Tết').closest('div.bg-white');
        fireEvent.click(postCard!);

        // 2. Kiểm tra Modal hiện ra
        expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
        // Kiểm tra nội dung chi tiết trong modal
        expect(screen.getByText('Nội dung sự kiện tết')).toBeInTheDocument();

        // 3. Click nút đóng Modal
        fireEvent.click(screen.getByRole('button', { name: '✕' }));

        // 4. Kiểm tra Modal biến mất
        expect(screen.queryByRole('button', { name: '✕' })).not.toBeInTheDocument();
    });

    it('xu ly loi API', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        // Mock API lỗi
        mockFetch.mockRejectedValueOnce(new Error('API Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Sukien />);

        await waitFor(() => {
            // Khi lỗi, danh sách rỗng -> hiện thông báo chưa có sự kiện
            expect(screen.getByText('📭 Chưa có sự kiện nào')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});