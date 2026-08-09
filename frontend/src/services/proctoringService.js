import api from './api';

export async function createSession(studentId, examTitle) {
  const response = await api.post('/api/v1/proctoring/sessions', {
    student_id: studentId,
    exam_title: examTitle,
  });
  return response.data;
}

export async function logAnomaly(sessionId, flagType, confidenceScore = 1.0, details = '') {
  const response = await api.post('/api/v1/proctoring/anomalies', {
    session_id: sessionId,
    flag_type: flagType,
    confidence_score: confidenceScore,
    details,
  });
  return response.data;
}

export async function closeSession(sessionId, status = 'COMPLETED') {
  const response = await api.patch(`/api/v1/proctoring/sessions/${sessionId}`, {
    status,
    end_time: new Date().toISOString(),
  });
  return response.data;
}
