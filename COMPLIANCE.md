# Ally Compliance Documentation

**Last Updated:** December 24, 2025  
**Version:** 1.0

This document outlines Ally's compliance posture and procedures for data protection regulations.

---

## Table of Contents

1. [GDPR Compliance](#gdpr-compliance)
2. [CCPA/CPRA Compliance](#ccpacpra-compliance)
3. [Data Retention Schedule](#data-retention-schedule)
4. [Subprocessor Management](#subprocessor-management)
5. [Data Breach Response](#data-breach-response)
6. [User Rights Procedures](#user-rights-procedures)

---

## GDPR Compliance

### Lawful Basis for Processing

| Data Category | Lawful Basis | Purpose |
|---------------|--------------|---------|
| Account Data | Contract | Service delivery |
| Aquarium/Water Data | Contract | Core functionality |
| Chat History | Contract | AI assistant feature |
| Usage Analytics | Legitimate Interest | Service improvement |
| Marketing | Consent | Optional communications |

### GDPR Checklist

- [x] **Lawful Basis**: Documented for all processing activities
- [x] **Privacy Policy**: Comprehensive, accessible, plain language
- [x] **Consent Management**: Cookie consent with granular controls
- [x] **Data Subject Rights**: All rights implemented (access, rectification, erasure, portability)
- [x] **Data Minimization**: Only necessary data collected
- [x] **Storage Limitation**: Retention periods defined
- [x] **Security Measures**: Encryption, access controls, audit logging
- [x] **Subprocessor Agreements**: DPAs with all processors
- [x] **Breach Notification**: 72-hour procedure documented
- [x] **Records of Processing**: Maintained internally
- [x] **Privacy by Design**: RLS, user isolation, minimal data collection

### Data Protection Officer

For GDPR inquiries, contact:
- **Email**: privacy@allybywaiterapp.com
- **Response Time**: Within 30 days

---

## CCPA/CPRA Compliance

### California Consumer Rights

- [x] **Right to Know**: Users can view all collected data
- [x] **Right to Delete**: Account deletion available in Settings
- [x] **Right to Opt-Out**: "Do Not Sell" implemented (we don't sell data)
- [x] **Right to Correct**: Users can update profile information
- [x] **Right to Limit Use**: Cookie preferences available
- [x] **Non-Discrimination**: Equal service regardless of privacy choices

### CCPA Checklist

- [x] **Privacy Policy**: CCPA-specific disclosures included
- [x] **Do Not Sell Link**: Footer link to privacy settings
- [x] **Opt-Out Mechanism**: Cookie preferences page
- [x] **Data Inventory**: Categories documented in Privacy Policy
- [x] **Verification Process**: Email verification for requests
- [x] **Response Timeline**: 45 days (extendable to 90)
- [x] **Service Provider Agreements**: Contracts with all vendors

### California Requests

- **Email**: privacy@allybywaiterapp.com
- **Response Time**: Within 45 days

---

## Data Retention Schedule

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Account Data | Until deletion requested | Automated purge |
| Aquarium Data | Until account deletion | Cascade delete |
| Water Test Results | Until account deletion | Cascade delete |
| Chat Messages | Until conversation deleted or account deletion | Cascade delete |
| Activity Logs | 2 years | Automated purge |
| Login History | 1 year | Automated purge |
| Support Tickets | 3 years after resolution | Automated purge |
| Analytics Data | 26 months | Automated purge |
| Error Logs (Sentry) | 90 days | Automatic |
| Backups | 30 days | Automatic rotation |

### Data Export

Users can export their data via:
1. **Settings → Privacy & Data → Export Data**
2. Email request to privacy@allybywaiterapp.com

Export format: JSON (machine-readable)

---

## Subprocessor Management

### Current Subprocessors

See [Subprocessors Page](/legal/subprocessors) for the complete list.

### Subprocessor Vetting Procedure

1. **Security Assessment**: Review SOC 2/ISO 27001 certifications
2. **DPA Review**: Ensure GDPR-compliant agreement
3. **Data Flow Analysis**: Document what data is shared
4. **Approval**: Legal and security team sign-off
5. **Documentation**: Add to public subprocessors list
6. **Notification**: Update subprocessors page (users can subscribe)

### Subprocessor Changes

- **Notification Period**: 30 days before new subprocessor goes live
- **Notification Method**: Status page and email to subscribers
- **Objection Period**: 14 days to raise concerns

---

## Data Breach Response

### Breach Response Team

| Role | Responsibility |
|------|----------------|
| Security Lead | Detection, containment, investigation |
| Legal | Regulatory notification, user communication |
| Engineering | Technical remediation |
| Support | User inquiries |

### Response Timeline

| Phase | Timeline | Actions |
|-------|----------|---------|
| Detection | Immediate | Identify and confirm breach |
| Containment | Within 4 hours | Stop ongoing exposure |
| Assessment | Within 24 hours | Determine scope and impact |
| Notification | Within 72 hours | Notify authorities (if required) |
| User Notification | Without undue delay | Inform affected users |
| Remediation | Ongoing | Fix vulnerabilities, prevent recurrence |
| Post-Mortem | Within 14 days | Document lessons learned |

### Notification Requirements

**GDPR (EU):**
- Supervisory authority: Within 72 hours
- Data subjects: Without undue delay if high risk

**CCPA (California):**
- Attorney General: If 500+ California residents affected
- Data subjects: Expedient manner

### Breach Notification Template

```
Subject: Important Security Notice from Ally

Dear [User],

We are writing to inform you of a security incident that may have affected your data.

What Happened: [Brief description]
What Data Was Affected: [Specific data types]
When It Occurred: [Date/time range]
What We Are Doing: [Remediation steps]
What You Can Do: [Recommended actions]

If you have questions, contact us at security@allybywaiterapp.com.

Sincerely,
The Ally Security Team
```

---

## User Rights Procedures

### Access Request (DSAR)

1. User submits request via email or Settings
2. Verify identity (email confirmation)
3. Compile data within 30 days
4. Deliver via secure download link
5. Log request completion

### Deletion Request

1. User requests via Settings → Delete Account OR email
2. Verify identity (password confirmation or email)
3. Grace period: 14 days to cancel
4. Execute deletion: Remove all user data
5. Confirm deletion via email
6. Retain minimal records for legal compliance (anonymized)

### Rectification Request

1. User updates via Settings OR submits request
2. Verify identity
3. Update records within 7 days
4. Confirm changes

### Data Portability

1. User requests via Settings → Export Data
2. Generate JSON export
3. Provide secure download link (valid 24 hours)
4. Log export event

---

## Audit Trail

All compliance-related actions are logged:

- Data access requests
- Account deletions
- Consent changes
- Subprocessor additions
- Policy updates

Logs retained for 2 years.

---

## Contact Information

| Department | Email | Response Time |
|------------|-------|---------------|
| Privacy | privacy@allybywaiterapp.com | 30 days |
| Security | security@allybywaiterapp.com | 24 hours |
| Legal | legal@allybywaiterapp.com | 7 days |
| Support | support@allybywaiterapp.com | 24 hours |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | December 24, 2025 | Initial release |

---

*This document is for internal use and compliance reference. Public-facing policies are available at allybywaiterapp.com.*
