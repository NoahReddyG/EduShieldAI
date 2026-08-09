import api from './api';

export async function getSessionReport(sessionId) {
  const response = await api.get(`/api/v1/reports/sessions/${sessionId}/report`);
  return response.data;
}
