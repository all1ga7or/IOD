import { getObjects } from '../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const objects = await getObjects();
    return NextResponse.json(objects);
  } catch (error) {
    console.error('Objects fetch error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні об\'єктів' },
      { status: 500 }
    );
  }
}
