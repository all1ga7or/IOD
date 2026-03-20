import { getLab2Results } from '../../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Доступ заборонено. Невірний пароль адміністратора.' },
        { status: 403 }
      );
    }

    const results = await getLab2Results();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Lab2 results fetch error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні результатів ЛР2' },
      { status: 500 }
    );
  }
}
