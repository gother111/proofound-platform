/**
 * File upload utilities for Supabase Storage
 */

import { getUserErrorMessage, logError } from '@/lib/error-handler';

export type UploadType = 'avatar' | 'cover' | 'document';
export type DocumentCategory = 'proof' | 'certificate' | 'artifact';

export interface UploadOptions {
  file: File;
  type: UploadType;
  category?: DocumentCategory;
  profileType?: 'individual' | 'organization';
  orgId?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  error?: string;
  message?: string;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { file, type, category, profileType, orgId, onProgress } = options;

  try {
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);

    if (category) {
      formData.append('category', category);
    }

    if (profileType) {
      formData.append('profileType', profileType);
    }

    if (orgId) {
      formData.append('orgId', orgId);
    }

    // Determine endpoint
    const endpoint = `/api/upload/${type}`;

    // Upload with progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (parseError) {
            logError('upload.parseResponse', parseError);
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            resolve({ success: false, error: error.error, message: error.message });
          } catch (parseError) {
            logError('upload.parseError', parseError);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', (event) => {
        // Extract useful error info from the error event
        logError('upload.networkError', event);
        reject(
          new Error('Network error during upload. Please check your connection and try again.')
        );
      });

      xhr.addEventListener('abort', (event) => {
        logError('upload.abort', event);
        reject(new Error('Upload was cancelled'));
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  } catch (error) {
    logError('uploadFile', error);
    return {
      success: false,
      error: 'Upload failed',
      message: getUserErrorMessage(error, 'Failed to upload file. Please try again.'),
    };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(path: string, type: UploadType): Promise<UploadResult> {
  try {
    const endpoint =
      type === 'document'
        ? `/api/upload/document?path=${encodeURIComponent(path)}`
        : `/api/upload/${type}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    const result = await response.json();
    return result;
  } catch (error) {
    logError('deleteFile', error);
    return {
      success: false,
      error: 'Delete failed',
      message: getUserErrorMessage(error, 'Failed to delete file. Please try again.'),
    };
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, type: UploadType): { valid: boolean; error?: string } {
  const MAX_SIZES: Record<UploadType, number> = {
    avatar: 5 * 1024 * 1024, // 5MB
    cover: 10 * 1024 * 1024, // 10MB
    document: 10 * 1024 * 1024, // 10MB
  };

  const ACCEPTED_TYPES: Record<UploadType, string[]> = {
    avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    cover: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    document: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  };

  const maxSize = MAX_SIZES[type];
  const acceptedTypes = ACCEPTED_TYPES[type];

  if (!acceptedTypes.includes(file.type)) {
    const typeLabels = {
      avatar: 'JPG, PNG, or WebP',
      cover: 'JPG, PNG, or WebP',
      document: 'PDF, images, or Word documents',
    };
    return {
      valid: false,
      error: `Invalid file type. Please upload ${typeLabels[type]}`,
    };
  }

  if (file.size > maxSize) {
    const sizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size exceeds ${sizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
