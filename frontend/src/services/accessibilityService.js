import api from './api';

export async function simplifyText(originalText) {
  const response = await api.post('/api/v1/accessibility/simplify-text', {
    original_text: originalText,
  });
  return response.data;
}
