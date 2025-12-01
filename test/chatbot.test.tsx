import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatBot from '../app/(main)/chatbot/page'; // Điều chỉnh đường dẫn nếu cần

// --- 1. MOCK GLOBAL FETCH ---
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// --- 2. MOCK LOCALSTORAGE ---
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

// --- 3. MOCK SCROLLINTOVIEW ---
// JSDOM không hỗ trợ layout nên hàm này thường gây lỗi nếu component có dùng ref để scroll
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('ChatBot Component', () => {
    const mockToken = 'fake-token-123';
    const mockUser = JSON.stringify({ access_token: mockToken });

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        // Mặc định set user đã đăng nhập
        localStorageMock.setItem('currentUser', mockUser);
    });

    it('hien thi giao dien ban dau (chua co tin nhan)', () => {
        render(<ChatBot />);

        // Check Header
        expect(screen.getByText('Trợ Lý AI - Ngọc Rồng Online')).toBeInTheDocument();

        // Check Empty State
        expect(screen.getByText('Bắt đầu cuộc trò chuyện!')).toBeInTheDocument();

        // Check Input & Button
        expect(screen.getByPlaceholderText('Nhập câu hỏi của bạn...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Gửi/i })).toBeInTheDocument();
    });

    it('khong gui tin nhan neu input rong', () => {
        render(<ChatBot />);

        const sendButton = screen.getByRole('button', { name: /Gửi/i });
        fireEvent.click(sendButton);

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('gui tin nhan thanh cong va hien thi phan hoi tu Bot', async () => {
        // Setup Mock API trả về text (vì code dùng res.text())
        mockFetch.mockResolvedValueOnce({
            text: async () => 'Xin chào! Tôi có thể giúp gì cho bạn?',
            ok: true,
        });

        render(<ChatBot />);

        const input = screen.getByPlaceholderText('Nhập câu hỏi của bạn...');
        const sendButton = screen.getByRole('button', { name: /Gửi/i });

        // 1. Nhập tin nhắn
        fireEvent.change(input, { target: { value: 'Hello Bot' } });

        // 2. Click Gửi
        fireEvent.click(sendButton);

        // 3. Kiểm tra tin nhắn của User hiện lên ngay lập tức
        expect(screen.getByText('Hello Bot')).toBeInTheDocument();
        // Input phải được clear
        expect(input).toHaveValue('');

        // 4. Kiểm tra gọi API đúng tham số và Header
        expect(mockFetch).toHaveBeenCalledWith('/api/ask', expect.objectContaining({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mockToken}`
            },
            body: JSON.stringify({ tinNhan: 'Hello Bot' })
        }));

        // 5. Kiểm tra tin nhắn của Bot hiện lên sau khi fetch xong
        await waitFor(() => {
            expect(screen.getByText('Xin chào! Tôi có thể giúp gì cho bạn?')).toBeInTheDocument();
        });
    });

    it('gui tin nhan bang phim Enter', async () => {
        mockFetch.mockResolvedValueOnce({
            text: async () => 'Enter received',
            ok: true,
        });

        render(<ChatBot />);
        const input = screen.getByPlaceholderText('Nhập câu hỏi của bạn...');

        fireEvent.change(input, { target: { value: 'Test Enter' } });

        // Giả lập nhấn phím Enter
        fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

        expect(screen.getByText('Test Enter')).toBeInTheDocument();
        expect(mockFetch).toHaveBeenCalled();
    });

    it('khong gui tin nhan khi nhan Shift + Enter (xuong dong)', () => {
        render(<ChatBot />);
        const input = screen.getByPlaceholderText('Nhập câu hỏi của bạn...');

        fireEvent.change(input, { target: { value: 'Line 1' } });

        // Giả lập Shift + Enter
        fireEvent.keyPress(input, { key: 'Enter', shiftKey: true, code: 'Enter', charCode: 13 });

        // API không được gọi
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('xu ly loi khi API tra ve loi (catch block)', async () => {
        // Mock API lỗi
        mockFetch.mockRejectedValueOnce(new Error('API Error'));
        // Spy console.error để tránh rác log trong terminal khi test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<ChatBot />);
        const input = screen.getByPlaceholderText('Nhập câu hỏi của bạn...');

        fireEvent.change(input, { target: { value: 'Help me' } });
        fireEvent.click(screen.getByRole('button', { name: /Gửi/i }));

        // Chờ tin nhắn lỗi của Bot xuất hiện trong UI
        await waitFor(() => {
            expect(screen.getByText('Error getting response')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it('hien thi trang thai loading khi dang goi API', async () => {
        // Mock API treo (chưa trả về ngay)
        mockFetch.mockImplementation(() => new Promise(() => { }));

        render(<ChatBot />);
        const input = screen.getByPlaceholderText('Nhập câu hỏi của bạn...');

        fireEvent.change(input, { target: { value: 'Loading test' } });
        fireEvent.click(screen.getByRole('button', { name: /Gửi/i }));

        // Input và Button phải bị disable khi đang loading
        expect(input).toBeDisabled();
        expect(screen.getByRole('button', { name: /Gửi/i })).toBeDisabled();
    });
});