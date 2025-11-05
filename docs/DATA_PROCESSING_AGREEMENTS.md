# Data Processing Agreements (DPAs)

**Last Updated**: November 6, 2025  
**Owner**: Privacy & Legal Team  
**Contact**: privacy@proofound.com

---

## Overview

This document outlines Proofound's Data Processing Agreements (DPAs) with third-party vendors who process user data on our behalf. All vendors are carefully vetted for GDPR and CCPA compliance.

**Reference**: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 19 (Compliance)

---

## 1. Supabase (Database, Authentication, Storage)

**Vendor**: Supabase Inc.  
**Service**: Backend-as-a-Service (Postgres, Auth, Storage)  
**Data Location**: United States (AWS us-east-1)  
**DPA Status**: ✅ Standard Contractual Clauses (SCCs) in place

### Purpose of Data Sharing

- **Database**: Store all application data (profiles, skills, messages, matches)
- **Authentication**: Handle user authentication and session management
- **Storage**: Store user-uploaded files (avatars, documents, evidence files)

### Data Categories Shared

- **Tier 1 PII**: Email addresses, phone numbers (encrypted)
- **Tier 2 Sensitive**: Professional data, verification requests, compensation expectations
- **Tier 3 Semi-Public**: Skills, projects, education, volunteering
- **Tier 4 Public**: Organization profiles, public assignments

### Security Measures Required

- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Row-Level Security (RLS) enforced
- ✅ Regular security audits (SOC 2 Type II certified)
- ✅ Data backup and disaster recovery
- ✅ GDPR-compliant data deletion

### Sub-Processors

Supabase uses AWS (Amazon Web Services) as infrastructure provider:
- **AWS**: SOC 2, ISO 27001, GDPR-compliant
- **Data Center**: us-east-1 (Virginia, USA)

### Data Deletion Procedures

- User-initiated deletion: Immediate via RLS policies
- Account deletion: 30-day grace period, then hard delete
- Backup retention: 90 days, then permanently deleted

### Contract Reference

- **DPA Signed**: January 2024
- **SCC Version**: Standard Contractual Clauses (EU Commission approved)
- **Review Date**: Annually (next review: January 2026)

---

## 2. Vercel (Hosting, Serverless Functions)

**Vendor**: Vercel Inc.  
**Service**: Next.js hosting and serverless API deployment  
**Data Location**: United States (AWS us-east-1)  
**DPA Status**: ✅ GDPR DPA in place

### Purpose of Data Sharing

- **Hosting**: Serve application frontend and API routes
- **Serverless Functions**: Execute backend logic (API endpoints)
- **Edge Network**: CDN for static assets and optimized delivery
- **Analytics**: Basic usage analytics (anonymized)

### Data Categories Shared

- **Tier 1 PII**: Session tokens (encrypted, temporary)
- **Tier 3-4**: Public profile data cached for performance
- **Analytics**: Anonymized page views, performance metrics (no PII)

### Security Measures Required

- ✅ TLS 1.3 for all traffic
- ✅ Environment variables encrypted at rest
- ✅ Function execution logs retained for 7 days only
- ✅ DDoS protection via Edge Network
- ✅ Regular security audits

### Sub-Processors

- **AWS**: Infrastructure provider (SOC 2, GDPR-compliant)
- **Cloudflare**: CDN and DDoS protection

### Data Deletion Procedures

- Session data: Auto-expires after 24 hours
- Function logs: Automatically deleted after 7 days
- Deployment artifacts: Retained for 30 days, then deleted

### Contract Reference

- **DPA Signed**: February 2024
- **Review Date**: Annually (next review: February 2026)

---

## 3. Resend (Email Delivery)

**Vendor**: Resend Inc.  
**Service**: Transactional email delivery  
**Data Location**: United States  
**DPA Status**: ✅ GDPR DPA in place

### Purpose of Data Sharing

- **Email Delivery**: Send transactional emails (verification, notifications, password resets)
- **Email Templates**: Render React Email templates
- **Tracking**: Basic delivery status (sent, delivered, bounced)

### Data Categories Shared

- **Tier 1 PII**: Email addresses (recipients only)
- **Tier 3-4**: Email content (verification requests, match notifications)
- **No sensitive data**: Passwords, payment info, or sensitive PII never sent via email

### Security Measures Required

- ✅ TLS encryption for API calls
- ✅ Email content encrypted in transit
- ✅ No email content stored after delivery
- ✅ Delivery logs retained for 30 days only
- ✅ DMARC, SPF, DKIM email authentication

### Sub-Processors

- **AWS SES**: Email sending infrastructure (SOC 2, GDPR-compliant)

### Data Deletion Procedures

- Email content: Not stored (streamed through)
- Delivery logs: Automatically deleted after 30 days
- Bounce/complaint data: Retained for 90 days for deliverability

### Contract Reference

- **DPA Signed**: March 2024
- **Review Date**: Annually (next review: March 2026)

---

## 4. OpenAI (AI Embeddings for Matching)

**Vendor**: OpenAI, L.L.C.  
**Service**: Text embeddings for skill/project matching  
**Data Location**: United States  
**DPA Status**: ✅ Enterprise Agreement with DPA

### Purpose of Data Sharing

- **Embeddings Generation**: Convert skills, projects, and bios into vector embeddings
- **Semantic Matching**: Power AI-driven candidate-opportunity matching

### Data Categories Shared

- **Tier 3 Semi-Public**: Skills, project descriptions, education, experience
- **NO Tier 1 PII**: Names, emails, phone numbers never sent
- **Pseudonymized**: User IDs hashed before sending

### Security Measures Required

- ✅ Data not used for model training (per OpenAI Enterprise Agreement)
- ✅ Data deleted after embedding generation (not stored by OpenAI)
- ✅ API calls encrypted with TLS 1.3
- ✅ Rate limiting to prevent abuse
- ✅ Audit logs of all API calls

### Data Retention

- **OpenAI**: Zero retention (data processed and deleted immediately)
- **Proofound**: Embeddings stored in Supabase vector database

### Contract Reference

- **DPA Signed**: April 2024
- **Enterprise Agreement**: Zero Data Retention (ZDR) tier
- **Review Date**: Annually (next review: April 2026)

---

## 5. Sentry (Error Monitoring)

**Vendor**: Functional Software, Inc. (Sentry)  
**Service**: Application error monitoring and performance tracking  
**Data Location**: United States  
**DPA Status**: ✅ GDPR DPA in place

### Purpose of Data Sharing

- **Error Tracking**: Monitor application errors and exceptions
- **Performance Monitoring**: Track API response times and frontend performance
- **Security Events**: Alert on security incidents (via our incident detection system)

### Data Categories Shared

- **NO Tier 1 PII**: PII automatically scrubbed before sending
- **Technical Data**: Stack traces, error messages, request URLs
- **Security Events**: Anonymized security incident data

### Security Measures Required

- ✅ PII scrubbing via beforeSend hooks (configured in sentry.server.config.ts)
- ✅ Email addresses replaced with user IDs
- ✅ IP addresses hashed
- ✅ Error data retained for 90 days only
- ✅ SOC 2 Type II certified

### Data Deletion Procedures

- Error events: Automatically deleted after 90 days
- Performance data: Aggregated and anonymized after 30 days

### Contract Reference

- **DPA Signed**: February 2024
- **Review Date**: Annually (next review: February 2026)

---

## 6. Veriff (Identity Verification - Optional Feature)

**Vendor**: Veriff OÜ  
**Service**: Identity verification for high-trust profiles  
**Data Location**: European Union (Estonia)  
**DPA Status**: ✅ GDPR DPA in place

### Purpose of Data Sharing

- **Identity Verification**: Verify government-issued ID for platform trust
- **KYC/AML Compliance**: Anti-fraud and anti-money laundering checks

### Data Categories Shared

- **Tier 1 PII**: Full name, date of birth, ID document images
- **Biometric Data**: Face verification (if user opts in)

### User Consent

- **Opt-in only**: Users explicitly choose to verify identity
- **Purpose explained**: Clear consent flow before verification starts
- **Retention**: Verification results stored, raw ID images deleted after 90 days

### Security Measures Required

- ✅ ISO 27001 certified
- ✅ GDPR Article 9 compliant (special category data)
- ✅ End-to-end encryption of ID documents
- ✅ Biometric data processed and deleted immediately after verification
- ✅ SOC 2 Type II certified

### Data Deletion Procedures

- Verification result: Stored as badge (verified/not verified)
- ID document images: Deleted after 90 days
- Biometric data: Never stored (processed in real-time only)

### Contract Reference

- **DPA Signed**: May 2024
- **Review Date**: Annually (next review: May 2026)

---

## 7. LinkedIn (OAuth Integration - Optional)

**Vendor**: LinkedIn Corporation (Microsoft)  
**Service**: OAuth authentication and profile import  
**Data Location**: United States  
**DPA Status**: ✅ Microsoft Privacy Statement applies

### Purpose of Data Sharing

- **OAuth Login**: Allow users to sign up/login with LinkedIn
- **Profile Import**: Pre-fill work experience and education (with user permission)

### Data Categories Shared

- **Tier 3 Semi-Public**: Work history, education, skills from LinkedIn profile
- **OAuth Token**: Encrypted access token (revocable by user)

### User Control

- **Opt-in**: Users choose to connect LinkedIn (not required)
- **Revocable**: Users can disconnect LinkedIn anytime
- **Selective Import**: Users choose which data to import

### Data Retention

- **OAuth Token**: Stored encrypted, deleted when user disconnects
- **Imported Data**: Becomes user's Proofound data, follows standard retention

### Contract Reference

- **Agreement**: Microsoft Privacy Statement & LinkedIn API Terms
- **Review Date**: Annually (next review: June 2026)

---

## DPA Management Process

### Annual Review Cycle

1. **Q1 (January-March)**: Review Supabase, Vercel, Resend DPAs
2. **Q2 (April-June)**: Review OpenAI, Sentry, Veriff DPAs
3. **Q3 (July-September)**: Assess new vendors, update this document
4. **Q4 (October-December)**: Internal security audit, DPA compliance check

### New Vendor Onboarding

Before adding a new vendor that processes user data:

1. **Privacy Assessment**: Evaluate data sharing necessity
2. **Security Audit**: Review vendor's security certifications
3. **DPA Negotiation**: Ensure GDPR/CCPA-compliant DPA in place
4. **Internal Approval**: Legal + Privacy team sign-off required
5. **Documentation**: Add to this document
6. **User Notice**: Update Privacy Policy if needed

### Vendor Exit Process

When terminating a vendor relationship:

1. **Data Retrieval**: Export all user data from vendor
2. **Deletion Request**: Submit formal data deletion request
3. **Verification**: Confirm deletion via vendor certificate
4. **Documentation**: Update this document and Privacy Policy
5. **User Notice**: Notify affected users if required

---

## Sub-Processor Restrictions

All vendors must:

- ✅ **Notify Proofound** before adding new sub-processors
- ✅ **Ensure equivalent data protection** for all sub-processors
- ✅ **Maintain list** of current sub-processors
- ✅ **Allow audits** of sub-processor compliance

---

## Data Transfer Mechanisms

### EU-US Data Transfers

For vendors in the United States processing EU user data:

- **Mechanism**: Standard Contractual Clauses (SCCs)
- **Legal Basis**: EU Commission Decision 2021/914
- **Alternative**: Data Processing Addendum (DPA) with SCCs incorporated

### International Data Transfers

- All vendors comply with Chapter V GDPR requirements
- Additional safeguards: encryption, pseudonymization, access controls

---

## Compliance Monitoring

### Vendor Security Audits

- **Frequency**: Annually for critical vendors (Supabase, Vercel)
- **Method**: Review SOC 2 reports, penetration test results
- **Action**: Update DPAs if gaps identified

### Incident Response

If a vendor experiences a data breach:

1. **Notification**: Vendor must notify Proofound within 24 hours
2. **Assessment**: Proofound evaluates impact on user data
3. **User Notification**: If Tier 1 PII exposed, notify affected users within 72 hours
4. **Remediation**: Work with vendor to implement fixes
5. **Review**: Consider vendor termination if breach was preventable

---

## Contact Information

### Proofound Privacy Team

- **Email**: privacy@proofound.com
- **DPA Requests**: Send to privacy@proofound.com with subject "DPA Request"
- **Security Concerns**: security@proofound.com

### Vendor DPA Contacts

| Vendor | DPA Contact | Email |
|--------|-------------|-------|
| Supabase | privacy@supabase.com | privacy@supabase.com |
| Vercel | privacy@vercel.com | privacy@vercel.com |
| Resend | privacy@resend.com | privacy@resend.com |
| OpenAI | privacy@openai.com | privacy@openai.com |
| Sentry | privacy@sentry.io | privacy@sentry.io |
| Veriff | gdpr@veriff.com | gdpr@veriff.com |

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-06 | Initial DPA documentation |
| (Future) | TBD | Updates as vendors change |

---

## Appendix: DPA Checklist

When evaluating new vendors, ensure:

- [ ] DPA explicitly covers GDPR Article 28 requirements
- [ ] Data processing purposes clearly defined
- [ ] Data categories and retention periods specified
- [ ] Security measures documented
- [ ] Sub-processor list provided
- [ ] Data deletion procedures outlined
- [ ] Breach notification procedures defined (24-72 hours)
- [ ] Audit rights preserved for Proofound
- [ ] Standard Contractual Clauses (SCCs) included (for non-EU vendors)
- [ ] Liability and indemnification clauses present

---

**Next Review Date**: November 2026  
**Document Owner**: Privacy & Legal Team  
**Approval**: Yurii Bakurov (Platform Owner)

