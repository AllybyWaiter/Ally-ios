/**
 * Cross-browser clipboard utility with fallback support
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  // Input validation
  if (typeof text !== 'string') {
    console.warn('copyToClipboard: Expected string input');
    return false;
  }
  
  // Modern Clipboard API with feature detection
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }
  
  // Fallback for older browsers or non-HTTPS contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Prevent scrolling to bottom
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', ''); // Prevent mobile keyboard popup
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
