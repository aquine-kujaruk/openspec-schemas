# money

### Decision: money-in-integer-cents · Money amounts use integer cents

@origin:2026-11-14-list-customer-orders @applies:domain,application,infrastructure,adapters @enforced:domain-and-acl-schemas,integration-tests,review

Money amounts SHALL be represented as integers in cents across the product. `OrderProps.totalCents` and service `total_cents` SHALL carry the same cents value without division, rounding or conversion into floating-point major currency units. JavaScript number values SHALL pass safe-integer validation so the representation preserves exact cents.

**Why** The user explicitly requires integer cents; retaining that unit avoids rounding and unit ambiguity at boundaries.
