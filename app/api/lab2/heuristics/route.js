import { getHeuristics } from '../../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const heuristics = await getHeuristics();
    return NextResponse.json(heuristics);
  } catch (error) {
    console.error('Heuristics fetch error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні евристик' },
      { status: 500 }
    );
  }
}
