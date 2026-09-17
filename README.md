# HHW Decision Router — bounded prototype

Scope: King County, WA + Tempe/Guadalupe, AZ × 8 difficult HHW taxonomies.

## Purpose
A field-test asset for Traffic Revenue Lab. It does not imply G1/G2 pass and is not a nationwide directory.

## Run locally
Open `index.html` in a browser. No build step, framework, cookies, analytics, or external JS dependencies.

## Data boundary
Every route links to a current official government source and shows `Last checked: 2026-09-16`.
Ambiguous conditions route to staff review/help-line rather than inventing a disposal decision.

## Supported taxonomies
1. Unknown/unlabeled chemical
2. Leaking/damaged container
3. Oversized container >5 gallons
4. Pesticide/herbicide
5. Gasoline/old fuel
6. Fluorescent/CFL/HID lamp
7. Propane/compressed gas
8. Paint/stain/varnish/solvent

## Field-test instrumentation to add after public hosting
- Search Console property / indexing
- privacy-preserving page-view and router-completion events
- outbound official-source click event
- jurisdiction/item selection counts
- referral source

Do not add advertising during the first field probe.
