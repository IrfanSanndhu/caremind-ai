import { apiClient } from './client';

export const pdfExportApi = {
  /** GET /api/pdf-export/visit-summary/:appointmentId */
  exportVisitSummary: async (appointmentId: string): Promise<Blob> => {
    const res = await apiClient.get(`/api/pdf-export/visit-summary/${appointmentId}`, {
      responseType: 'blob',
    });
    return res.data as Blob;
  },
};

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
