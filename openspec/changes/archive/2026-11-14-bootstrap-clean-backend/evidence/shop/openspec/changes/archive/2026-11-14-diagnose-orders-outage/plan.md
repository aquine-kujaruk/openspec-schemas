---
name: diagnose-orders-outage
description: Record the production diagnostic procedure for customer order listing failures.
created_at: 2026-11-14
created_by: user
schema: clean-backend
---

# Diagnose an orders service outage

## Goal

Preserve a repeatable procedure for diagnosing customer order listing errors during an orders service outage. The user reports that last night's outage caused twenty minutes of errors; this is incident context, not a newly verified finding. On archive, the procedure is available under `openspec/runbooks/diagnose`.

## Decisions

- Record a diagnostic procedure only; discard code changes and behavioural delta specs because the requested change affects operational documentation alone.
- Use the reported incident as context; discard reconstructing exact incident timestamps or performing a live production investigation in this change.

## Open questions

## Architecture decisions

## Procedures

### Procedure: orders-service-outage · Diagnose customer order listing errors

@adds @purpose:diagnose @topic:orders @env:prod

**When** Customers report errors listing their orders, particularly when the orders service may be unavailable.

**Requires** AWS CLI and authorized read access to the prod account through profile `shop-readonly`. Credentials are kept in the team vault at `shop/aws-readonly`; obtain them through the team's vault access process and configure the local profile without putting secret values in repository files or incident notes. The orders service log group is `/shop/orders-api`. Access to our application's logs is also required. Confirm the prod region and our application's log location from the existing environment configuration; neither is specified here.

**Steps**

1. Establish the time window from customer reports, recording timezone and converting the interval to UTC. Include a margin before and after the reports; do not assume every recurrence lasts twenty minutes.
2. Confirm that AWS CLI profile `shop-readonly` targets the prod account and the configured region contains `/shop/orders-api`. If access or configuration is missing, resolve it through the team vault and existing environment configuration before interpreting missing results.
3. Use the AWS CLI with `--profile shop-readonly` to read `/shop/orders-api` over the report window. Look for HTTP 5xx responses; record timestamps, response status and any available request or correlation identifiers.
4. Search our application's logs over the same interval for `OrdersUnavailableException`. Record timestamps and any available request or correlation identifiers.
5. Correlate both sets of evidence with the customer reports. Record the observed failure interval, matching requests where identifiers exist, and gaps or conflicting evidence. No matching entries alone does not establish service health; check account, region, log source and time window before drawing a conclusion.

**Verification** The incident notes identify the inspected time window and timezone, prod account/profile, service log group and application log source, and the presence or absence of 5xx responses and `OrdersUnavailableException`. Any conclusion is supported by timestamped evidence; unresolved access or evidence gaps remain explicit. No live production diagnosis was performed while planning this procedure.

## Phases

No implementation phases: this change builds nothing and changes no product behaviour.

## Feedback

## Next step

Validate planning readiness. Subsequent verification and archive publish this procedure to the durable runbooks; no code implementation is required.
