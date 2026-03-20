import { getLab2Objects, getLab2MockVotes } from '../../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const objects = await getLab2Objects();
    const mockVotes = await getLab2MockVotes();
    return NextResponse.json({ objects, mockVotes });
  } catch (error) {
    console.error('Lab2 objects fetch error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні об\'єктів ЛР2' },
      { status: 500 }
    );
  }
}
