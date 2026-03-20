import { hasVotedLab2, submitHeuristicVote } from '../../../../lib/db';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { expertId, heuristicIds } = await request.json();

    // heuristicIds is now an array of { id, rank } where rank 1=best, 3=least
    if (!expertId || !heuristicIds || !Array.isArray(heuristicIds) || heuristicIds.length !== 3) {
      return NextResponse.json(
        { error: 'Оберіть рівно 3 евристики' },
        { status: 400 }
      );
    }

    // Validate unique heuristics
    const ids = heuristicIds.map(h => h.id);
    if (new Set(ids).size < 3) {
      return NextResponse.json(
        { error: 'Оберіть 3 різні евристики' },
        { status: 400 }
      );
    }

    // Validate ranks
    const ranks = heuristicIds.map(h => h.rank).sort();
    if (ranks[0] !== 1 || ranks[1] !== 2 || ranks[2] !== 3) {
      return NextResponse.json(
        { error: 'Ранги мають бути 1, 2, 3' },
        { status: 400 }
      );
    }

    const alreadyVoted = await hasVotedLab2(expertId);
    if (alreadyVoted) {
      return NextResponse.json(
        { error: 'Ви вже голосували за евристики. Повторне голосування не допускається.' },
        { status: 400 }
      );
    }

    await submitHeuristicVote(expertId, heuristicIds);

    return NextResponse.json({ success: true, message: 'Голос за евристики успішно збережено!' });
  } catch (error) {
    console.error('Lab2 vote error:', error);
    return NextResponse.json(
      { error: 'Помилка при збереженні голосу' },
      { status: 500 }
    );
  }
}
