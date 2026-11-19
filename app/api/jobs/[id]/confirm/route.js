import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { admin } from '@/lib/supabaseAdmin';
import { calcAmount, MAX_MB, MAX_PAGES } from '@/lib/pricing';

export async function POST(_req, { params }) {
  const sb = admin();
  const { data: job } = await sb.from('print_jobs').select('*').eq('id', params.id).single();
  if (!job || job.status !== 'pending')
    return NextResponse.json({ error: 'জব পাওয়া যায়নি' }, { status: 404 });

  const reject = async (msg) => {
    await sb.storage.from('pdfs').remove([job.file_path]);
    await sb.from('print_jobs').update({ status: 'error' }).eq('id', job.id);
    return NextResponse.json({ error: msg }, { status: 400 });
  };

  const { data: blob, error } = await sb.storage.from('pdfs').download(job.file_path);
  if (error || !blob) return NextResponse.json({ error: 'ফাইল পাওয়া যায়নি' }, { status: 400 });
  if (blob.size > MAX_MB * 1024 * 1024) return reject(`ফাইল ${MAX_MB}MB এর বেশি`);

  let pages;
  try {
    const pdf = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
    pages = pdf.getPageCount();
  } catch {
    return reject('এটা সঠিক PDF নয়');
  }
  if (pages > MAX_PAGES) return reject(`সর্বোচ্চ ${MAX_PAGES} পেজ`);

  const amount = calcAmount(pages, job.copies, job.color);
  await sb.from('print_jobs').update({ pages, amount, status: 'ready' }).eq('id', job.id);

  return NextResponse.json({ pages, amount, testPay: process.env.ALLOW_TEST_PAY === 'true' });
}
