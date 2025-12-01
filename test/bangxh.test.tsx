import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Bangxh from '../app/(main)/bangxh/page';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

// Mock data giả lập các trường hợp: 
// 1. Số dạng Object { low: ... }
// 2. Số dạng primitive (number)
// 3. Thiếu username (test logic fallback Player ID)
const mockDataResponse = {
    users: [
        { id: 101, username: 'Top1_Boss', sucManh: { low: 2000000 }, sucManhDeTu: 500000, vang: { low: 999999 }, ngoc: 100 },
        { id: 102, auth_id: 8888, username: null, sucManh: 1500000, sucManhDeTu: 200000, vang: 50000, ngoc: 50 },
        { id: 103, username: 'Top3_Gamer', sucManh: 1000000, sucManhDeTu: 100000, vang: 10000, ngoc: 20 },
        { id: 104, username: 'Top4_Normal', sucManh: 500000, sucManhDeTu: 50000, vang: 5000, ngoc: 10 }
    ]
};

describe('Bangxh Component Integrity Test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('hien thi loading spinner ngay khi mount', () => {
        mockFetch.mockImplementation(() => new Promise(() => { }));
        render(<Bangxh />);
        expect(screen.getByText('Đang tải thông tin...')).toBeInTheDocument();
    });

    it('render du lieu chinh xac: format so, xu ly object low, va ten fall-back', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockDataResponse,
        });

        render(<Bangxh />);

        await waitFor(() => {
            expect(screen.queryByText('Đang tải thông tin...')).not.toBeInTheDocument();
        });

        // Check 1: Format số và xử lý object { low: 2000000 }
        expect(screen.getByText('2,000,000')).toBeInTheDocument();

        // Check 2: Logic fallback tên "Player {auth_id}" khi username null
        expect(screen.getByText('Player 8888')).toBeInTheDocument();

        // Check 3: Hiển thị đủ Top 3 podium
        expect(screen.getByText('Top1_Boss')).toBeInTheDocument();
        expect(screen.getByText('Top3_Gamer')).toBeInTheDocument();

        // Check 4: List bên dưới (Top 4)
        expect(screen.getByText('Top4_Normal')).toBeInTheDocument();
    });

    it('chuyen tab hoat dong dung logic: doi header va du lieu hien thi', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => mockDataResponse,
        });

        render(<Bangxh />);
        await waitFor(() => expect(screen.getByText('Top1_Boss')).toBeInTheDocument());

        // Mặc định là Tab Sức Mạnh
        const tabSucManhHeader = screen.getAllByText('SỨC MẠNH');
        expect(tabSucManhHeader.length).toBeGreaterThan(0);
        expect(screen.getByText('2,000,000')).toBeInTheDocument(); // Giá trị sức mạnh

        // Click chuyển sang Tab Đại Gia (Vàng)
        const tabVangBtn = screen.getByText('TOP ĐẠI GIA');
        fireEvent.click(tabVangBtn);

        // Kiểm tra UI đã update
        const tabVangHeader = screen.getAllByText('VÀNG');
        expect(tabVangHeader.length).toBeGreaterThan(0);
        expect(screen.getByText('999,999')).toBeInTheDocument(); // Giá trị Vàng
    });

    it('hien thi Empty State khi API tra ve mang rong', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ users: [] }),
        });

        render(<Bangxh />);

        await waitFor(() => {
            expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
        });
    });

    it('catch loi API va hien thi Empty State thay vi crash app', async () => {
        // Giả lập API chết hoặc trả về lỗi 500
        mockFetch.mockRejectedValue(new Error('Internal Server Error'));

        // Tắt log error của console để output test sạch đẹp
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Bangxh />);

        await waitFor(() => {
            // Logic của component là: catch error -> setUsers([]) -> Render "Không có dữ liệu"
            expect(screen.getByText('Không có dữ liệu')).toBeInTheDocument();
        });

        // Đảm bảo error được log (cho developer debug) dù UI vẫn render an toàn
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});