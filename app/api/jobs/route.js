import { NextResponse } from 'next/server';
import { admin } from '@/lib/supabaseAdmin';
import { MAX_COPIES } from '@/lib/pricing';

export async function POST(req) {
  const { copies, color, name } = await req.json();
  const c = Number(copies);
  if (!Number.isInteger(c) || c < 1 || c > MAX_COPIES)
    return NextResponse.json({ error: 'কপি সংখ্যা ঠিক নয়' }, { status: 400 });
  if (typeof name !== 'string' || !name.toLowerCase().endsWith('.pdf'))
    return NextResponse.json({ error: 'শুধু PDF দিন' }, { status: 400 });

  const sb = admin();
  const id = crypto.randomUUID();
  const path = `${id}.pdf`;

  const { error } = await sb.from('print_jobs').insert({
    id, file_path: path, original_name: name.slice(0, 100),
    copies: c, color: !!color, status: 'pending',
  });
  if (error) return NextResponse.json({ error: 'জব বানানো যায়নি' }, { status: 500 });

  const { data, error: e2 } = await sb.storage.from('pdfs').createSignedUploadUrl(path);
  if (e2) return NextResponse.json({ error: 'আপলোড লিংক বানানো যায়নি' }, { status: 500 });

  return NextResponse.json({ id, path, token: data.token });
}
