/**
 * reportService.js — Post-Exam Report API
 */
import api from './api';

/**
 * Fetch the full integrity report for a completed exam session.
 * @param {number} sessionId
 * @returns {Promise<{ session_info, total_anomalies_flagged, anomaly_timeline, integrity_rating }>}
 */
export async function getSessionReport(sessionId) {
  const response = await api.get(`/api/v1/reports/sessions/${sessionId}/report`);
  return response.data;
}
