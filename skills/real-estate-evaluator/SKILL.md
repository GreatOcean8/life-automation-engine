---
name: real-estate-evaluator
description: Evaluates home listings against price caps, cap rates, and target zip codes.
ui_schema:
  title: "Real Estate Market Watcher"
  controls:
    - id: max_price
      label: "Max Purchase Price ($)"
      type: "slider"
      min: 300000
      max: 2000000
      step: 25000
      default: 850000
    - id: min_cap_rate
      label: "Min Cap Rate (%)"
      type: "slider"
      min: 4.0
      max: 12.0
      step: 0.5
      default: 6.0
rules:
  - "Reject listings with cap rate < 6.0%."
  - "Highlight listings with cap rate > 7.5% as GREAT_DEAL."
---

# Real Estate Evaluator Skill Instructions

1. Calculate Price per SqFt and Net Cap Rate.
2. Evaluate listing against target zip codes (78701, 78704, 78746).
3. Generate property deal Task Card for qualifying listings.
