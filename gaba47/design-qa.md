# 嘎巴47 Design QA

- Source visual truth: `/workspace/scratch/cd7ab7c12df6/generated_images/exec-6bdcfe75-5569-4cf5-8950-415f96e97fc0.png`
- Implementation: `http://terminal.local:4173/?preview=1`
- Browser comparison surface: `http://terminal.local:4173/qa-comparison.html` (temporary side-by-side QA surface, removed after review)
- Browser-rendered implementation screenshot: Work Mode cloud-browser capture emitted during this build; browser file persistence was read-only, so the screenshot has no durable filesystem path.
- Viewport: 393 × 852 CSS px inside the comparison frame
- Source pixels: 852 × 1830; normalized to 393 × 852 for comparison
- Implementation pixels: browser capture at 1× CSS scale inside a 393 × 852 iframe
- State: 首页，空数据预览；0 次训练、0 位本周参与者

## Full-view comparison evidence

The source and implementation were rendered together in one browser viewport. Both use the same near-black shell, acid-green primary challenge card, purple secondary card peek, compact athletic typography hierarchy, open activity section, and floating five-item bottom navigation. The implementation intentionally uses a truthful empty state instead of the source concept's sample members and training records.

## Focused checks

- Typography: hierarchy and weights match the source direction; Chinese glyphs use system UI fallbacks for reliable loading.
- Spacing: title, card rail, activity heading, and bottom navigation remain visible at 393 px. No horizontal page overflow; the card rail alone scrolls horizontally by design.
- Colors: near-black, acid green, violet, muted gray, and white tokens are consistent across all screens.
- Images: no stock fitness photography, mascots, skulls, cats, or skeleton assets. Only real user-uploaded check-in photos can appear in the feed.
- Copy: app-specific labels are Chinese and preserve the five existing routes. Challenge copy was changed from a mock-specific strength sprint to the product-wide five-workout weekly goal.
- Icons: locally hosted Phosphor icon font; no emoji or handcrafted SVG substitutes.

## Primary interactions tested

- Bottom navigation: 今日、排行、群友、我的、去打卡.
- Check-in form: training type selection, body-part selection, +5 minute stepper, and note persistence across re-render.
- Join form: invitation code and nickname inputs; submit button enabled after valid input. Submission was not triggered during QA to avoid creating a test Supabase profile.
- Console: no application errors or warnings from `terminal.local`; only an unrelated browser-extension metadata error was observed.

## Comparison history

1. First comparison — P2: the mobile title and challenge card were too tall, reducing above-the-fold activity density.
2. Fix — added the 430 px mobile density pass: 38 px title, 310 px card minimum, tighter padding, 74 px progress number, and a shorter bottom navigation.
3. Second comparison — no remaining P0/P1/P2 visual or interaction issues. The remaining content difference is intentional: production uses real data or a proper empty state, never visual mock records.

## Follow-up polish

- P3: when real group activity becomes dense, recheck long nickname truncation and photo crops using actual production records.

## Follow-up validation — near-week make-up check-ins

- Added seven date choices: today plus the previous six calendar days.
- Verified selecting a past date changes `aria-pressed` and the acid-green selected state, while training type and duration controls continue to work.
- The selected local date is converted to an ISO timestamp and written to `checkins.created_at`, so feed order, calendar, monthly totals, and rankings use the make-up date.
- Replaced the loading message with the single line “等待嘎巴”.
- Browser QA found no application errors or horizontal page overflow.

final result: passed
