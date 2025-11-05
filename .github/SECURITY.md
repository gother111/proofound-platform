# Security Policy

## Reporting a Vulnerability

Proofound takes security seriously. We appreciate your efforts to responsibly disclose any security vulnerabilities you find.

### How to Report

**Email**: security@proofound.com

Please include the following information in your report:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)
- Your contact information for follow-up

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 24 hours.

2. **Assessment**: We will investigate and assess the vulnerability within 5 business days.

3. **Resolution Timeline**: 
   - Critical vulnerabilities: Fixed within 7 days
   - High severity: Fixed within 14 days
   - Medium severity: Fixed within 30 days
   - Low severity: Fixed within 60 days

4. **Updates**: We will keep you informed throughout the remediation process.

5. **Disclosure**: After the vulnerability is fixed, we will coordinate with you on public disclosure timing.

### Scope

The following are **in scope** for security reports:

- **Web Application**: https://proofound.com
- **API Endpoints**: https://proofound.com/api/*
- **Authentication System**: Login, signup, password reset
- **Data Privacy**: Unauthorized access to user data
- **Database Security**: SQL injection, RLS policy bypasses
- **File Uploads**: Malicious file execution
- **Session Management**: Session hijacking, fixation

The following are **out of scope**:

- Social engineering attacks
- Denial of Service (DoS) attacks
- Physical attacks against our offices or equipment
- Attacks requiring physical access to user devices
- Previously reported vulnerabilities
- Theoretical attacks without proof of concept

### Safe Harbor

We support safe harbor for security researchers who:

- Make a good faith effort to avoid privacy violations, data destruction, and service disruption
- Only interact with test accounts you own or with explicit permission from the account holder
- Give us a reasonable time to fix the issue before public disclosure
- Do not exploit the vulnerability beyond the minimum necessary to demonstrate it

We will not pursue legal action against researchers who follow these guidelines.

### Bug Bounty Program

We currently do not have a paid bug bounty program. However, we will:

- Publicly acknowledge researchers who report valid vulnerabilities (with permission)
- Provide swag/merchandise for significant findings
- Consider implementing a paid program in the future as we scale

### Recognition

We maintain a Hall of Fame for security researchers who have helped us improve our security:

**2025**:
- (No reports yet)

### Security Best Practices

We follow these security practices:

- **Encryption**: All data encrypted at rest (AES-256) and in transit (TLS 1.3)
- **Authentication**: JWT-based with optional MFA
- **Authorization**: Row-Level Security (RLS) policies on all database tables
- **Input Validation**: All user input validated and sanitized
- **Rate Limiting**: API endpoints protected against brute force attacks
- **Audit Logging**: All sensitive actions logged for security review
- **Regular Updates**: Dependencies updated monthly, security patches applied immediately
- **Code Review**: All code reviewed before deployment
- **Privacy by Design**: GDPR and CCPA compliant from day one

### Compliance

Proofound complies with:

- **GDPR** (General Data Protection Regulation)
- **CCPA** (California Consumer Privacy Act)
- **SOC 2** (in preparation)

### Security Contact

**Email**: security@proofound.com  
**Emergency**: For critical vulnerabilities affecting live systems  
**Response Time**: 24 hours acknowledgment, 5 days assessment

### Version History

- **v1.0** (2025-11-06): Initial security policy
- (Future updates will be documented here)

---

Thank you for helping keep Proofound and our users safe!

