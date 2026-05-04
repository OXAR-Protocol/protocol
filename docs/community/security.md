# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in OXAR Protocol, please report it responsibly.

**DO NOT** create a public GitHub issue for security vulnerabilities.

### How to Report

Email: security@oxar.xyz (TBD)

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- Acknowledgment: within 48 hours
- Initial assessment: within 7 days
- Fix deployed: depends on severity

### Scope

In scope:
- Smart contracts (Solana programs)
- Frontend application security
- Oracle manipulation vectors
- Access control issues

Out of scope:
- Social engineering attacks
- Denial of service
- Issues in third-party dependencies (report to them directly)

### Bug Bounty

A formal bug bounty program will be announced after mainnet launch. Until then, significant findings will be rewarded at the team's discretion.

## Audit Status

- [ ] Internal review: In progress
- [ ] External audit: Planned for post-hackathon
- [ ] Formal verification: Future consideration

## Smart Contract Security Practices

- All arithmetic uses checked operations (overflow protection)
- PDA seeds are deterministic and validated
- Authority checks on all admin functions
- Standard Anchor account validation patterns
- Open source for community review
