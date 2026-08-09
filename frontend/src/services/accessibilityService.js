/**
 * accessibilityService.js — AI Text Simplification API
 */
import api from './api';

/**
 * Send complex exam text to the LLM for dyslexia-friendly simplification.
 * @param {string} originalText
 * @returns {Promise<{ simplified_text: string, bullet_points: string[] }>}
 */
export async function simplifyText(originalText) {
  const response = await api.post('/api/v1/accessibility/simplify-text', {
    original_text: originalText,
  });
  return response.data;
}
