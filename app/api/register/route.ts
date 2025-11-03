import { NextRequest, NextResponse } from 'next/server';

// Backend URL - đọc từ biến môi trường hoặc dùng localhost
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Forwarding to backend:', `${BACKEND_URL}/auth/register`);
    console.log('Request body:', body);
    
    // Gọi backend API
    const response = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    console.log('Backend response:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Đăng ký thất bại!' },
      { status: 500 }
    );
  }
}