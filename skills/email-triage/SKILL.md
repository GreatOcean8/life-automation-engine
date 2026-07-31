---
name: email-triage
description: Audits Gmail threads for urgent bills, invoices, and scheduling items.
ui_schema:
  title: "Email & Bill Triage Settings"
  controls:
    - id: auto_pay_threshold
      label: "Auto-Pay Limit ($)"
      type: "slider"
      min: 25
      max: 500
      step: 25
      default: 100
    - id: auto_flag_invoices
      label: "Auto-Flag Invoice Emails"
      type: "toggle"
      default: true
rules:
  - "NEVER auto-pay any bill over the auto_pay_threshold."
  - "Always queue bills > threshold in WAITING_FOR_APPROVAL status."
---

# Email Triage Skill Instructions

1. Scan incoming messages for invoice indicators (e.g. invoice, bill, payment due).
2. Calculate due dates and dollar amounts.
3. If amount > auto_pay_threshold, flag for Human approval.
