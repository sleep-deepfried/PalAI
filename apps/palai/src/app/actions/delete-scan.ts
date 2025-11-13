'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { getDemoUserId } from '@/lib/demo-user';

export async function deleteScan(scanId: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Supabase admin client not configured' };
    }

    // First, get the scan to find the image URL
    const { data: scan, error: fetchError } = await supabaseAdmin
      .from('scans')
      .select('image_url')
      .eq('id', scanId)
      .single();

    if (fetchError || !scan) {
      return { success: false, error: 'Scan not found' };
    }

    // Extract the file path from the image URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/palai-images/{path}
    const imageUrl = (scan as { image_url: string }).image_url;
    if (!imageUrl) {
      return { success: false, error: 'Image URL not found' };
    }
    const match = imageUrl.match(/\/palai-images\/(.+)$/);
    
    if (match && match[1]) {
      const filePath = match[1];
      
      // Delete the image from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from('palai-images')
        .remove([filePath]);

      if (storageError) {
        console.error('Failed to delete image from storage:', storageError);
        // Continue anyway to delete the database record
      }
    }

    // Delete the scan record from the database
    const { error: deleteError } = await supabaseAdmin
      .from('scans')
      .delete()
      .eq('id', scanId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Revalidate the history page to update the UI
    revalidatePath('/history');

    return { success: true };
  } catch (error) {
    console.error('Delete scan error:', error);
    return { success: false, error: 'Failed to delete scan' };
  }
}

export async function deleteAllScans(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: 'Supabase admin client not configured' };
    }

    const userId = await getDemoUserId();

    // Get all scans for this user
    const { data: scans, error: fetchError } = await supabaseAdmin
      .from('scans')
      .select('image_url')
      .eq('user_id', userId);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    if (!scans || scans.length === 0) {
      return { success: true }; // Nothing to delete
    }

    // Extract file paths from image URLs and delete from storage
    const filePaths: string[] = [];
    scans.forEach((scan: { image_url: string }) => {
      const match = scan.image_url.match(/\/palai-images\/(.+)$/);
      if (match && match[1]) {
        filePaths.push(match[1]);
      }
    });

    if (filePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('palai-images')
        .remove(filePaths);

      if (storageError) {
        console.error('Failed to delete images from storage:', storageError);
        // Continue anyway to delete the database records
      }
    }

    // Delete all scan records for this user
    const { error: deleteError } = await supabaseAdmin
      .from('scans')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Revalidate the history page
    revalidatePath('/history');

    return { success: true };
  } catch (error) {
    console.error('Delete all scans error:', error);
    return { success: false, error: 'Failed to clear history' };
  }
}

