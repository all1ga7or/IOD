import { hasVoted, submitVote } from '../../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { expertId, rank1, rank2, rank3 } = await request.json();

    // Валідація
    if (!expertId || !rank1 || !rank2 || !rank3) {
      return NextResponse.json(
        { error: 'Усі 3 позиції мають бути заповнені' },
        { status: 400 }
      );
    }

    // Перевірка: 3 різні об'єкти
    const ids = [String(rank1), String(rank2), String(rank3)];
    if (new Set(ids).size < 3) {
      return NextResponse.json(
        { error: 'Оберіть 3 різні об\'єкти' },
        { status: 400 }
      );
    }

    // Перевірка: чи вже голосував
    const alreadyVoted = await hasVoted(expertId);
    if (alreadyVoted) {
      return NextResponse.json(
        { error: 'Ви вже проголосували. Повторне голосування не допускається.' },
        { status: 400 }
      );
    }

    await submitVote(expertId, rank1, rank2, rank3);

    return NextResponse.json({ success: true, message: 'Голос успішно збережено!' });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Помилка при збереженні голосу' },
      { status: 500 }
    );
  }
}
