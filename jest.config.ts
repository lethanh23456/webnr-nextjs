// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

// Khởi tạo next/jest với đường dẫn tới next.config.mjs và thư mục gốc của dự án
const createJestConfig = nextJest({
    dir: './',
});

// Thêm cấu hình tùy chỉnh của Jest
const config: Config = {
    // Đặt môi trường test thành jsdom (mô phỏng trình duyệt)
    testEnvironment: 'jest-environment-jsdom',

    // Các file setup để chạy trước mỗi bài test
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Tùy chỉnh các module import
    moduleNameMapper: {
        // Map alias "@/" thành đường dẫn thực tế (ví dụ: "@/components" -> "src/components")
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Bỏ qua các thư mục không cần test
    modulePathIgnorePatterns: ['<rootDir>/.next/'],

    // Thư mục gốc chứa source code, nếu bạn dùng 'src/'
    rootDir: './',
};

// Xuất cấu hình Jest. Sử dụng createJestConfig để Next.js xử lý việc mapping.
export default createJestConfig(config);