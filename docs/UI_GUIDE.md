# UI Design Guide

## Design Principles

1. Should look like a calm utility dashboard used daily by someone's adult child — NOT a SaaS landing page. No marketing feel.
2. Large text, generous spacing. Target user is 40–55 with imperfect vision.
3. Status clarity > visual polish. One glance must answer: "Is mom okay right now?"

## AI Slop Anti-patterns — Do Not Use

| Prohibited                             | Reason                       |
| -------------------------------------- | ---------------------------- |
| backdrop-filter: blur()                | glass morphism = AI template |
| gradient text                          | #1 sign of AI SaaS page      |
| "Powered by AI" badge                  | decoration, no user value    |
| glow animations                        | neon = AI slop               |
| purple/indigo brand color              | AI = purple cliché           |
| identical rounded-2xl on every surface | template feel                |
| blurred gradient orbs                  | AI landing page marker       |

## Colors

Light theme. No dark mode for MVP.

### Background

| Usage  | Value               |
| ------ | ------------------- |
| page   | #fafaf9 (stone-50)  |
| card   | #ffffff             |
| border | #e7e5e4 (stone-200) |

### Text

| Usage     | Value               |
| --------- | ------------------- |
| primary   | #1c1917 (stone-900) |
| body      | #44403c (stone-700) |
| secondary | #78716c (stone-500) |

### Semantic

| Usage     | Value               | Use                              |
| --------- | ------------------- | -------------------------------- |
| ok        | #15803d (green-700) | "Everything's okay"              |
| attention | #b45309 (amber-700) | Missed dose, low stock           |
| urgent    | #b91c1c (red-700)   | Flagged transaction, cam offline |

## Components

### Card

`rounded-lg bg-white border border-stone-200 p-6 shadow-sm`

### Button (primary)

`rounded-md bg-stone-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-stone-800`

### Status pill

`inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-{semantic}-50 text-{semantic}-700`

## Layout

- Single-column max-w-3xl centered
- Spacing: gap-4 within cards, space-y-6 between sections
- Left-aligned text

## Typography

| Usage      | Style                                    |
| ---------- | ---------------------------------------- |
| page title | text-3xl font-semibold text-stone-900    |
| card title | text-base font-medium text-stone-900     |
| body       | text-base text-stone-700 leading-relaxed |
| metadata   | text-sm text-stone-500                   |

Base font-size is `text-base` (16px) or larger everywhere. No `text-xs` for anything the user needs to read.

## Animation

- fade-in on mount (0.3s)
- no hover animations beyond color change
- no spinners; use skeleton blocks

## Icons

- lucide-react, strokeWidth 1.75, size 20
- no icon containers (no rounded background boxes)
