import { getResults } from '../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Перевірка пароля адміна через header
    const adminPassword = request.headers.get('x-admin-password');
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Доступ заборонено. Невірний пароль адміністратора.' },
        { status: 403 }
      );
    }

    const results = await getResults();
    return NextResponse.json({ ...results, debug_db_url: process.env.DATABASE_URL });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні результатів' },
      { status: 500 }
    );
  }
}
