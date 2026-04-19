# PRD: NannyCam

## Goal

Give adult children of cognitively-declined elderly parents a single iMessage thread that watches medication adherence, restocks the pantry autonomously, and flags suspicious purchases — so they don't have to be physically present to know their parent is safe.

## Users

- **Primary (interface user):** Adult child, 40–55, holds Power of Attorney for a parent with diagnosed cognitive decline (dementia, post-stroke, etc.)
- **Beneficiary (non-interface):** Elderly parent living alone or semi-independently

This product is explicitly NOT for monitoring cognitively intact seniors. Onboarding splash confirms POA authority.

## Core Features (MVP)

1. **Medication verification.** Webcam watches pill organizer around scheduled dose times. Gemini verifies correct compartment was emptied. Result pushed to caretaker via iMessage with snapshot.
2. **Autonomous pantry restocking.** Webcam samples pantry. When staples drop below threshold, Knot AgenticShopping places a Walmart reorder. Order >2× historical average triggers approval request via iMessage instead of auto-executing.
3. **Bill Protector.** Every new transaction via Knot TransactionLink is classified by Gemini against caretaker-set rules. Flagged transactions trigger an approve/block iMessage.
4. **Conversational agent in iMessage.** Caretaker can ask the thread status questions in natural language ("did she take her morning pills?", "reorder groceries", "what happened today?") and get real answers.
5. **Nightly day summary.** At 9pm, agent sends a one-paragraph summary of the day's events.
6. **Caretaker dashboard.** Single-page view of recent events, current rules, and patient status. Clean, large-text, non-technical UI.

## Out of MVP Scope

- Raspberry Pi hardware (will use laptop webcam for demo)
- Fall detection / inactivity monitoring
- Echo Show / voice integration
- Android/SMS (iMessage-first is deliberate)
- Multi-caretaker observer roles
- Real clinical pill identification (we verify compartment emptying, not pill identity)
- Authentication (MVP is utility-only; iMessage phone number is soft auth)
- Production Knot environment (development env only)

## Design

- Dashboard: clean, light, spacious. Sans-serif. Think "utility app for someone's mom," not "SaaS landing page."
- Primary accent: single calm color (green for OK, amber for attention, red for urgent)
- No dark mode, no gradients, no purple. See UI_GUIDE.md
