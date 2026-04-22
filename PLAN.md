# Fix RevenueCat handling, keep paywall navigation stable, and redesign virtue selection

## Features
- [x] Fix the subscription data handling so purchase status loads cleanly and never shows raw system error text to the user.
- [x] Make the paywall close back to the exact screen the user came from every time.
- [x] Return users to their previous screen after a successful purchase or restore when they opened the paywall from somewhere else in the app.
- [x] Remove the extra RevenueCat refresh control from the paywall if it is not required for purchase or restore to work.
- [x] Keep restore purchases working from the paywall.
- [x] Keep all existing paywall copy and subscription details visible, including name, duration, price, and billing cycle.
- [x] Redesign the startup virtue selection into two compact side-by-side sections.
- [x] Make Franklin’s virtues a compact accordion with a chevron and tight inline rows, collapsed by default.
- [x] Show custom virtues in a locked premium state for free users with a subtle premium indicator.
- [x] When a free user taps the locked custom virtues section, show a short upgrade prompt and let them choose whether to continue to the paywall.

## Design
- [x] Preserve the current color palette, typography, and overall visual style.
- [x] Tighten spacing so the virtue selection feels lighter and more space-efficient without looking cramped.
- [x] Avoid large cards and oversized padding on the startup selection screen.
- [x] Keep the premium lock treatment understated and polished rather than loud or distracting.
- [x] Maintain iPhone and iPad friendly layouts so the two-column structure stays clear and balanced on larger screens.

## Pages / Screens
- [x] **Paywall**: Better silent error handling, no raw object text, no refresh control, and close behavior that always returns to the previous screen.
- [x] **Virtue selection**: Two compact columns, with Franklin’s virtues in a collapsed accordion on the left and custom virtues in a premium-locked section on the right.
- [x] **Upgrade prompt**: Short upgrade message when free users tap locked custom virtues, with a clear next step to open the paywall if they want.

## Behavior details
- [x] Purchase cancellation will stay quiet and not show failure messaging.
- [x] Revenue-related failures will use calm user-friendly fallback messaging only when needed.
- [x] Navigation will respect the user’s origin instead of forcing them into the virtue selection flow.
- [x] Startup virtue selection will remain functional while becoming denser, clearer, and easier to scan.
