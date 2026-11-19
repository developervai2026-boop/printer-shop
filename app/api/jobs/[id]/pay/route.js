import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabaseAdmin';
import { createPayment } from '@/lib/shurjopay';

export async function POST(req, { params }) {
  const { data: job } = await admin().from('print_jobs').select('*').eq('id', params.id).single();
  if (!job || job.status !== 'ready')
    return NextResponse.json({ error: 'জব রেডি নয়' }, { status: 400 });
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0];
    const url = await createPayment({ jobId: job.id, amount: job.amount, ip });
    return NextResponse.json({ url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'পেমেন্ট শুরু করা যায়নি' }, { status: 500 });
  }
}
