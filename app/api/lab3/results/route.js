import { getLab3Results } from '../../../../lib/db';
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

    const results = await getLab3Results();
    return NextResponse.json(results);
  } catch (error) {
    console.error('Lab3 results error:', error);
    return NextResponse.json(
      { error: 'Помилка при завантаженні результатів ЛР3', details: error.message },
      { status: 500 }
    );
  }
}
