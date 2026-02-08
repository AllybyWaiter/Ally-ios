/**
 * Standardized email response templates for admin communications
 */

export interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

export const responseTemplates: EmailTemplate[] = [
  {
    name: 'Thank You',
    subject: 'Thank you for contacting us',
    body: `Hi {{name}},

Thank you for reaching out to us. We've received your message and will get back to you shortly.

Best regards,
The Team`,
  },
  {
    name: 'Follow Up',
    subject: 'Following up on your inquiry',
    body: `Hi {{name}},

Thank you for your patience. We wanted to follow up on your inquiry about your message.

Is there anything else we can help you with?

Best regards,
The Team`,
  },
  {
    name: 'Issue Resolved',
    subject: 'Your inquiry has been resolved',
    body: `Hi {{name}},

We're pleased to inform you that your inquiry has been resolved.

If you have any further questions, please don't hesitate to reach out.

Best regards,
The Team`,
  },
];

/**
 * Replace template placeholders with actual values
 */
export function applyTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return result.replace(new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g'), value);
    },
    template
  );
}
