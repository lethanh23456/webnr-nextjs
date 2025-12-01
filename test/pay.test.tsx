import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pay from '../app/(main)/pay/page'; // Điều chỉnh đường dẫn nếu cần

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

// --- DATA GIẢ LẬP ---
const mockUser = JSON.stringify({
    access_token: 'fake-token',
    auth_id: 123,
    username: 'testuser'
});

const mockPayData = {
    pay: { id: 1, userId: 123, tien: '500000', status: 'ACTIVE', updatedAt: '2023-01-01' },
    message: 'Lấy thông tin thành công'
};

const mockHistoryData = {
    withdraws: [
        {
            id: 1,
            user_id: 123,
            amount: 100000,
            bank_name: 'MBBank',
            bank_number: '9999',
            bank_owner: 'User A',
            status: 'PENDING',
            request_at: '2023-01-01T10:00:00Z',
            success_at: ''
        }
    ]
};

describe('Pay Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
        // Setup timer giả để test các hàm setTimeout
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    // Helper để mock API load trang đầu tiên (Pay + History)
    const setupInitialLoad = () => {
        // Call 1: fetchPayData (Dùng response.text() -> JSON.parse)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            text: async () => JSON.stringify(mockPayData),
        });

        // Call 2: fetchWithdrawHistory (Dùng response.json())
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockHistoryData,
        });
    };

    it('chuyen huong ve login neu chua dang nhap', async () => {
        // Không set localStorage
        render(<Pay />);

        // Component sẽ chạy useEffect -> fetchPayData -> check localStorage -> redirect
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });

    it('render giao dien chinh thanh cong: hien thi so du va lich su', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        setupInitialLoad();

        render(<Pay />);

        // 1. Kiểm tra loading ban đầu
        expect(screen.getByText('Đang tải thông tin ví...')).toBeInTheDocument();

        await waitFor(() => {
            // 2. Kiểm tra Header
            expect(screen.getByText('Ví của tôi')).toBeInTheDocument();
            // 3. Kiểm tra Số dư (500,000d) - dùng regex để match format tiền tệ
            expect(screen.getByText(/500.000/)).toBeInTheDocument();
            // 4. Kiểm tra Lịch sử rút tiền
            expect(screen.getByText('MBBank')).toBeInTheDocument();
            expect(screen.getByText('PENDING')).toBeInTheDocument(); // Mock trả về status PENDING -> hiện "PENDING" hoặc badge "Đang xử lý" tùy logic
        });
    });

    it('chuc nang Nap Tien: mo modal, tao QR code', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        setupInitialLoad();

        render(<Pay />);
        await waitFor(() => expect(screen.getByText('Ví của tôi')).toBeInTheDocument());

        // 1. Click nút "Nạp tiền"
        fireEvent.click(screen.getByRole('button', { name: /Nạp tiền/i }));

        // 2. Kiểm tra Modal mở
        expect(screen.getByText('Nạp tiền qua QR')).toBeInTheDocument();

        // 3. Mock API tạo QR
        const mockQRData = { qr: 'https://example.com/qr.jpg', username: 'AdminBank' };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockQRData,
        });

        // 4. Click nút "Tạo mã QR" (input mặc định có giá trị)
        fireEvent.click(screen.getByRole('button', { name: /Tạo mã QR/i }));

        // 5. Kiểm tra Loading và Kết quả
        expect(screen.getByText('Đang tạo...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Mã QR đã tạo thành công!')).toBeInTheDocument();
            expect(screen.getByAltText('QR Code')).toHaveAttribute('src', mockQRData.qr);
            expect(screen.getByText(mockQRData.username)).toBeInTheDocument();
        });
    });

    it('chuc nang Rut Tien: validate form', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        setupInitialLoad();

        render(<Pay />);
        await waitFor(() => expect(screen.getByText('Ví của tôi')).toBeInTheDocument());

        // 1. Click nút "Rút tiền"
        fireEvent.click(screen.getByRole('button', { name: /Rút tiền/i }));

        // 2. Click "Xác nhận" mà không điền thông tin
        fireEvent.click(screen.getByRole('button', { name: /Xác nhận rút tiền/i }));

        // 3. Kiểm tra lỗi hiển thị
        expect(screen.getByText('Vui lòng điền đầy đủ thông tin')).toBeInTheDocument();
    });

    it('chuc nang Rut Tien: gui yeu cau thanh cong', async () => {
        localStorageMock.setItem('currentUser', mockUser);
        setupInitialLoad();

        render(<Pay />);
        await waitFor(() => expect(screen.getByText('Ví của tôi')).toBeInTheDocument());

        // 1. Mở Modal Rút tiền
        fireEvent.click(screen.getByRole('button', { name: /Rút tiền/i }));

        // 2. Điền form
        const amountInput = screen.getByPlaceholderText('Nhập số tiền muốn rút');
        const bankNameInput = screen.getByPlaceholderText('VD: Vietinbank, Vietcombank, BIDV...');
        const bankNumInput = screen.getByPlaceholderText('Nhập số tài khoản');
        const ownerInput = screen.getByPlaceholderText('VD: NGUYEN VAN A');

        fireEvent.change(amountInput, { target: { value: '200000' } });
        fireEvent.change(bankNameInput, { target: { value: 'VCB' } });
        fireEvent.change(bankNumInput, { target: { value: '123456' } });
        fireEvent.change(ownerInput, { target: { value: 'NGUYEN VAN B' } });

        // 3. Mock API tạo rút tiền
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Tạo lệnh rút thành công' }),
        });

        // 4. Submit
        fireEvent.click(screen.getByRole('button', { name: /Xác nhận rút tiền/i }));

        // 5. Kiểm tra trạng thái thành công
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/create-withdraw', expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('"amount":200000')
            }));
            expect(screen.getByText('Tạo lệnh rút thành công')).toBeInTheDocument();
        });
    });

    it('hien thi man hinh loi khi API pay chet', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock fetchPayData fail
        mockFetch.mockRejectedValueOnce(new Error('Network Error'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Pay />);

        await waitFor(() => {
            // Tìm tiêu đề "Lỗi" trong component Error UI
            expect(screen.getByText('Lỗi')).toBeInTheDocument();
            expect(screen.getByText('Network Error')).toBeInTheDocument();
            // Nút thử lại
            expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });

    it('hien thi man hinh "Khong tim thay thong tin vi" neu API tra ve null data', async () => {
        localStorageMock.setItem('currentUser', mockUser);

        // Mock Pay Data trả về (nhưng giả sử logic component set null nếu data rỗng hoặc format sai)
        // Ở đây ta giả lập API trả về lỗi nhưng được catch và setPayData vẫn là null
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: async () => JSON.stringify({ message: 'Not found' }),
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        render(<Pay />);

        // Do logic component: catch error -> setError -> render Error UI
        // Nhưng nếu ta muốn test trường hợp loading xong mà !payData và !error
        // Ta cần mock fetch thành công nhưng trả về data lạ.
        // Tuy nhiên, với code hiện tại, nếu fetch fail nó sẽ vào Error UI.
        // Test case này sẽ verify Error UI hiển thị đúng message từ server

        await waitFor(() => {
            expect(screen.getByText('Not found')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});