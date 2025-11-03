import { NextRequest, NextResponse } from 'next/server';


const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Forwarding to backend:', `${BACKEND_URL}/auth/login`);
    console.log('Request body:', { username: body.username, password: body.password });
    
    
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    console.log('Backend response status:', data);
   

    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'Đăng nhập thất bại!' },
      { status: 500 }
    );
  }
}