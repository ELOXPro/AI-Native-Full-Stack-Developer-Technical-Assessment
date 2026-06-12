# MineTech Systems Corporate Policy Guidelines

Welcome to the official corporate guidelines document. This document outlines our standard operating procedures, support terms, billing details, and security policies.

---

## 1. Corporate Billing & Refund Terms
* **Billing Cycle**: All customer subscriptions operate on a calendar month cycle. Invoices are dispatched on the 1st of each month and must be settled within 14 calendar days.
* **Payment Methods**: We accept bank transfers, credit card payments (Visa, MasterCard, Amex), and corporate PayPal accounts.
* **Refund Policy**: Customers are eligible for a full refund if a cancellation request is submitted within 7 business days of the initial subscription activation. After 7 business days, refunds are calculated pro-rata based on the remaining days of the current billing cycle.
* **Late Payments**: Subscriptions are automatically suspended if invoices remain unpaid for more than 30 consecutive calendar days.

---

## 2. User Account Access & Security Policies
* **MFA Requirement**: All administrative accounts must enforce Multi-Factor Authentication (MFA) using standard authenticator apps (e.g. Google Authenticator, Microsoft Authenticator). SMS-based MFA is deprecated.
* **Password Expiry**: Passwords must be updated every 90 days. New passwords must contain at least 12 characters, including uppercase letters, numbers, and special characters.
* **Account Lockout**: After 5 consecutive failed login attempts, accounts are locked for safety reasons. Locked accounts can be unlocked via the password recovery link or by contacting the Internal Account Security team.
* **Email Modifications**: To change an account's registered email address, users must submit a request accompanied by a copy of their corporate ID.

---

## 3. Technical Support Operating Procedures
* **Supported Platforms**: MineTech software is officially supported on Windows 10/11, macOS Sequoia (and later), and Ubuntu Linux 22.04 LTS.
* **Response SLAs**: 
  * *Critical*: Under 1 hour (24/7 coverage).
  * *High*: Under 4 hours (business hours).
  * *Medium/Low*: Under 24 business hours.
* **Troubleshooting Connection Issues**: If the application fails to connect to local database engines:
  1. Verify the connection string prefix is set to `postgresql://` and not `postgres://`.
  2. Confirm that port 5432 is open on your host firewall.
  3. Inspect the PostgreSQL service status via systemctl or the Windows services manager.
