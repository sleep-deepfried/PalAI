'use server';

import { processImage, validateImageFile } from '@/lib/image';
import { diagnoseWithFailover } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { getDemoUserId } from '@/lib/demo-user';

export async function uploadAndDiagnose(formData: FormData) {
  const file = formData.get('image') as File;
  const locale = (formData.get('locale') as 'en' | 'tl') || 'en';
  // TODO: Get userId from session when auth is implemented
  const userId = await getDemoUserId();

  if (!file) {
    throw new Error('No image file provided');
  }

  // Validate file
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Process image
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const processedBuffer = await processImage(buffer);

  // Diagnose with failover
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const diagnosis = await diagnoseWithFailover(
    {
      imageBuffer: processedBuffer,
      mimeType: 'image/jpeg',
      promptExtras: { locale },
    },
    {
      n8n: n8nWebhookUrl
        ? {
            webhookUrl: n8nWebhookUrl,
            signingSecret: process.env.N8N_SIGNING_SECRET,
          }
        : undefined,
      nextApi: {
        baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      local: true,
    }
  );

  // Validate diagnosis result
  if (!diagnosis || !diagnosis.label || !diagnosis.severity) {
    console.error('Invalid diagnosis result:', JSON.stringify(diagnosis, null, 2));
    throw new Error('Failed to get valid diagnosis. Please try again.');
  }

  console.log('Diagnosis result:', {
    label: diagnosis.label,
    severity: diagnosis.severity,
    confidence: diagnosis.confidence,
  });

  // Check if supabaseAdmin is available
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured. Please set SUPABASE_SERVICE_ROLE_KEY.');
  }

  // Upload to Supabase Storage
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('palai-images')
    .upload(`${userId}/${fileName}`, processedBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from('palai-images')
    .getPublicUrl(uploadData.path);

  const imageUrl = urlData.publicUrl;

  // Insert scan record (treatment data will be fetched separately on result page)
  const { data: scanData, error: scanError } = await supabaseAdmin
    .from('scans')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      label: diagnosis.label,
      confidence: diagnosis.confidence,
      severity: diagnosis.severity,
      explanation_en: diagnosis.explanationEn,
      explanation_tl: diagnosis.explanationTl,
      cautions: diagnosis.cautions,
      prevention_steps: [],
      treatment_steps: [],
      sources: [],
    })
    .select()
    .single();

  if (scanError) {
    throw new Error(`Failed to save scan: ${scanError.message}`);
  }

  redirect(`/result/${scanData.id}`);
}

