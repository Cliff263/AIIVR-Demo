import { NextResponse } from 'next/server';
import { initSocket } from '@/lib/socket';

export async function GET(req: Request, res: Response) {
  try {
    const io = initSocket(res as any);
    return new NextResponse('WebSocket server initialized');
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 