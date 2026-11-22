import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { createPayment } from '@/lib/sslcommerz';
import crypto from 'crypto';

export async function POST(request, context) {
  try {
    const body = await request.json();
    const { copies, color, fileName, fileUrl } = body;

    if (!copies || Number(copies) < 1) {
      return NextResponse.json(
        { error: 'কপির সংখ্যা ঠিক না' },
        { status: 400 }
      );
    }

    if (!fileName || String(fileName).trim() === '') {
      return NextResponse.json(
        { error: 'ফাইল সিলেক্ট করুন' },
        { status: 400 }
      );
    }

    const id = context?.params?.id || crypto.randomUUID();
    const token = crypto.randomBytes(4).toString('hex').toUpperCase();
    const path = `print_jobs/${id}.pdf`;

    const { error: insertError } = await supabase
      .from('print_jobs')
      .insert({
        id,
        file_path: path,
        original_name: fileName,
        file_url: fileUrl || null,
        copies: Number(copies),
        color: Boolean(color),
        status: 'pending',
      });

    if (insertError) {
      return NextResponse.json(
        { error: 'জব সেভ করা যায়নি' },
        { status: 500 }
      );
    }

    const { data, error: urlError } = await supabase
      .from('print_jobs')
      .select('id, token')
      .eq('id', id)
      .single();

    if (urlError) {
      return NextResponse.json(
        { error: 'পেমেন্ট লিংক তৈরি করা যায়নি' },
        { status: 500 }
      );
    }

    const paymentResponse = await createPayment({
      jobId: id,
      token: data?.token || token,
      copies: Number(copies),
      color: Boolean(color),
      fileName,
    });

    return NextResponse.json({
      id,
      path,
      token: data?.token || token,
      payment: paymentResponse,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'সার্ভার এরর হয়েছে' },
      { status: 500 }
    );
  }
}
