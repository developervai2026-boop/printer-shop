import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabaseAdmin';

export async function GET(_req, { params }) {
  const { data } = await admin().from('print_jobs').select('status').eq('id', params.id).single();
  if (!data) return NextResponse.json({ error: 'পাওয়া যায়নি' }, { status: 404 });
  return NextResponse.json({ status: data.status });
}
