import { apiClient } from './apiClient';
import type { ApiResponse } from './apiClient';

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
}

export interface UploadParams {
  file: File;
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
  description?: string;
}

class AttachmentService {
  /**
   * Upload a file
   */
  async uploadFile(params: UploadParams): Promise<ApiResponse<Attachment>> {
    try {
      const formData = new FormData();
      formData.append('file', params.file);
      formData.append('entityType', params.entityType);
      formData.append('entityId', params.entityId);
      
      if (params.description) {
        formData.append('description', params.description);
      }

      const response = await apiClient.post<Attachment>('/api/attachments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to upload file'],
        data: null as any
      };
    }
  }

  /**
   * Get attachment by ID
   */
  async getAttachment(id: string): Promise<ApiResponse<Attachment>> {
    try {
      const response = await apiClient.get<Attachment>(`/api/attachments/${id}`);
      return {
        success: true,
        data: response.data,
        message: 'Attachment fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch attachment'],
        data: null as any
      };
    }
  }

  /**
   * Get attachments for an entity
   */
  async getAttachments(entityType: string, entityId: string): Promise<ApiResponse<Attachment[]>> {
    try {
      const response = await apiClient.get<Attachment[]>('/api/attachments', {
        params: { entityType, entityId }
      });
      return {
        success: true,
        data: response.data,
        message: 'Attachments fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to fetch attachments'],
        data: null as any
      };
    }
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(id: string): Promise<ApiResponse<null>> {
    try {
      await apiClient.delete(`/api/attachments/${id}`);
      return {
        success: true,
        data: null,
        message: 'Attachment deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to delete attachment'],
        data: null
      };
    }
  }

  /**
   * Download attachment
   */
  async downloadAttachment(id: string): Promise<ApiResponse<Blob>> {
    try {
      const response = await apiClient.get<Blob>(`/api/attachments/${id}/download`, {
        responseType: 'blob'
      });
      return {
        success: true,
        data: response.data,
        message: 'Attachment downloaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Failed to download attachment'],
        data: null as any
      };
    }
  }

  /**
   * Get attachment URL for direct access
   */
  getAttachmentUrl(id: string): string {
    return `${apiClient.getInstance().defaults.baseURL}/api/attachments/${id}/download`;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file icon based on mime type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('text/')) return '📄';
    return '📎';
  }
}

export const attachmentService = new AttachmentService(); 