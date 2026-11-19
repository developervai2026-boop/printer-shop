import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabaseAdmin';

export async function POST(_req, { params }) {
  if (process.env.ALLOW_TEST_PAY !== 'true')
    return NextResponse.json({ error: 'বন্ধ' }, { status: 403 });
  const { data } = await admin().from('print_jobs')
    .update({ status: 'paid' }).eq('id', params.id).eq('status', 'ready').select('id');
  if (!data || data.length === 0)
    return NextResponse.json({ error: 'জব রেডি নয়' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
