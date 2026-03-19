import { getOrCreateExpert } from '../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Ім\'я не може бути порожнім' },
        { status: 400 }
      );
    }

    const expert = await getOrCreateExpert(name.trim());

    return NextResponse.json({
      id: expert.id,
      name: expert.name,
      role: expert.role
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Помилка сервера при авторизації' },
      { status: 500 }
    );
  }
}
