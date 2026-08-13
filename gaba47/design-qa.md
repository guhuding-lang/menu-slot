# 嘎巴47 v2 Design QA

- Source visual truth:
  - `/workspace/scratch/cd7ab7c12df6/generated_images/exec-18a1f9c9-7e68-4964-bc4c-b344cd6b11ed.png`
  - `/workspace/scratch/cd7ab7c12df6/generated_images/exec-8c216f1a-30c4-4c91-a11c-5e5a8de65a7d.png`
- Browser-rendered implementation:
  - `/workspace/scratch/cd7ab7c12df6/repo/gaba47/qa-home.png`
  - `/workspace/scratch/cd7ab7c12df6/repo/gaba47/qa-profile.png`
  - `/workspace/scratch/cd7ab7c12df6/repo/gaba47/qa-edit.png`
  - `/workspace/scratch/cd7ab7c12df6/repo/gaba47/qa-delete.png`
- Combined comparison evidence:
  - `/workspace/scratch/cd7ab7c12df6/repo/gaba47/qa-home-comparison.png`
  - `/workspace/scratch/cd7ab7c12df6/repo/gaba47/qa-states-comparison.png`
- Viewport: 393 × 852 CSS px, deviceScaleFactor 1; responsive spot check at 360 × 800.
- Source pixels: home 851 × 1847; states 1728 × 927.
- Implementation pixels: home 393 × 1096 full page; profile 393 × 852; edit 393 × 1206 full page; delete 393 × 852.
- Density normalization: source images resized to the implementation comparison width; browser captures remained at 1 CSS pixel = 1 image pixel.
- State: signed-in preview with local-only fixture data; production identity behavior separately tested with mocked Supabase responses and no real writes.
- Browser method: Browser/IAB was unavailable in this workspace. Chromium 149 via Puppeteer Core was installed under `/tmp` only and used as the documented fallback.

## Full-view comparison evidence

- Composition: both source and implementation use a quiet header, short question, one dominant weekly module, open activity list, and persistent five-item navigation.
- Typography: Noto Sans SC 400/700 is locally hosted; Chinese labels, figures, controls, and compact captions render clearly without fallback squares.
- Color/tokens: true-black canvas, charcoal surfaces, lime active state, purple/green/orange edge light, subtle borders, and muted gray labels match the source direction.
- Layout rhythm: 18px mobile gutters, 22–28px radii, one primary dashboard card, compact feed rows, and visible bottom safe area preserve the reference hierarchy.
- Icons: local Phosphor icon font supplies consistent outline navigation, training, like, edit, cloud, camera, and delete metaphors.
- Image quality: no fake stock imagery or generated avatars ship in the app; real user avatars/photos are signed Supabase storage images, with nickname initials as the empty fallback.
- Copy/content: above-the-fold copy is limited to `嘎巴47`, `今晚，动哪儿？`, real training metrics, `去打卡`, `群友动态`, and the specified navigation. No calorie/sleep/fake health metrics were added.

## Focused state comparison evidence

- Profile editor: avatar picker, nickname field, close control, and lime `保存修改` action are visible and thumb-sized. A bottom sheet is used instead of the concept's inset panel because it preserves usable input space at 393px; the visual system is unchanged.
- Edit check-in: seven-date near-week selector, training type, multi-select parts, duration stepper, optional photo, note, `保存修改`, and destructive `删除` are all present.
- Delete confirmation: explicit irreversible copy, separate cancel/confirm actions, and red destructive emphasis are visible over retained page context.

## Interaction and responsive verification

- Like changed from 3 to 4 immediately before the mocked remote promise completed.
- Own-record edit opened `编辑打卡`; seven date choices and delete entry were present.
- Delete confirmation opened and canceled successfully.
- Profile editor opened with the current nickname.
- 360px check reported `scrollWidth === innerWidth`; fixed bottom navigation remained visible.
- Console and page error list: empty.
- Identity test results:
  - missing local nickname + existing cloud profile → restored `原来的昵称`, entered home, zero profile writes;
  - mismatched local UUID + cloud session UUID → showed `身份没有被覆盖`, zero profile writes;
  - genuine first visit → showed join page with empty invitation code, zero profile writes before submit.

## Comparison history

1. P1 — CJK characters rendered as boxes in the serverless Chromium environment.
   - Fix: added locally hosted Noto Sans SC 400/700 WOFF2 assets and explicit font-face declarations.
   - Post-fix evidence: `qa-home-comparison.png` and `qa-states-comparison.png` show all Chinese copy rendered correctly.
2. P2 — modal backdrop hid too much of the underlying profile/edit context.
   - Fix: reduced backdrop opacity from .74 to .58 and blur from 9px to 5px.
   - Post-fix evidence: final profile/delete captures retain recognizable underlying structure without weakening modal focus.
3. P3 — an existing record without a photo said `更换照片`.
   - Fix: changed the empty-photo action to `添加训练照`.

## Remaining intentional deviations

- Example figures and portrait avatars from the concept are not copied; production uses live Supabase data and real uploads only.
- Profile editing uses a mobile bottom sheet rather than embedding the editor inside the profile card.
- The activity list can extend beyond two rows because it displays the user's real history; the first viewport remains compact.

final result: passed
