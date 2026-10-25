# optikí UI test plan

TestSprite runs these cases from the portal's UI project, on every ready (non-draft) PR against its preview (`ci-previews.yaml`). The portal doesn't read this file. It is the reviewed copy: change a case here and in the portal in the same PR.

## Portal setup

- **Target URL:** `https://optikii.netlify.app`. On a PR, the GitHub trigger swaps in `https://deploy-preview-{pr}--optikii.netlify.app`.
- **Test credentials:** the seeded demo account (`DEMO_EMAIL` / `DEMO_PASSWORD` on the server). They live only in the portal, never in git.
- **Run Behavior:**
  - **Log in once per run: off.** The signed-out cases need a fresh browser; a shared session would give them all 17 rules.
  - **Always use planned steps: on.** Runs follow the steps below instead of replaying an old recording.
  - **Viewport:** the default desktop size.
- **Adding a case:** Add More Tests → Add Test Manually. Use the section heading as the use case, and copy the title, priority, description and steps as written. Every label in quotes is the exact text on the page.

The URL scanned is `https://docease-v2.netlify.app`, a client-rendered app whose raw HTML is an empty shell. Signed out, it's fetched and scanned statically; signed in, it's rendered in a real browser and screenshotted.

Every case asserts on the scan it just created, never on history order or counts: the production database is shared and never reset.

---

## Signed-out scanning

### U1 · Scanning the OPT-101 broken example fails OPT-101 and shows how to fix it

- **Priority:** High
- **Description:** A signed-out visitor scans the Gym's broken OPT-101 page. The report marks OPT-101 as failed and its finding explains the fix with before and after code.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Click the "Load example OPT-101 broken" button
  3. Assertion: The OPT-101 rule in the report shows the result "Fail"
  4. Action: Click "How to fix OPT-101"
  5. Assertion: A code example titled "After" is visible

### U2 · Scanning the OPT-101 fixed example passes OPT-101

- **Priority:** High
- **Description:** A signed-out visitor scans the Gym's fixed OPT-101 page, and the rule passes.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Click the "Load example OPT-101 fixed" button
  3. Assertion: The OPT-101 rule in the report shows the result "Pass"

### U3 · Scanning the Perfect page example scores 100

- **Priority:** Medium
- **Description:** The Gym's perfect page has no problems, so its report scores 100.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Click the "Load example Perfect page" button
  3. Assertion: The number shown above "Overall score" is 100

### U4 · A signed-out URL scan of docease-v2 runs statically with the 9 core rules

- **Priority:** High
- **Description:** Signed out, a URL is fetched without a browser and scanned with the 9 core rules. The report says so.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Click the "URL" tab
  3. Action: Type https://docease-v2.netlify.app into the "Page address" field
  4. Action: Click the "Scan URL" button
  5. Assertion: The report shows a "Static" badge
  6. Assertion: The report shows a notice starting "Ran the 9 core rules."

### U5 · Scanning a private address shows "This address isn't allowed"

- **Priority:** High
- **Description:** Addresses on private or loopback networks are refused before anything is fetched.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Click the "URL" tab
  3. Action: Type http://127.0.0.1 into the "Page address" field
  4. Action: Click the "Scan URL" button
  5. Assertion: An alert reads "This address isn't allowed"

### U6 · An address without https:// is rejected before scanning

- **Priority:** Low
- **Description:** The URL form only accepts full addresses, and says how to fix one that isn't.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Click the "URL" tab
  3. Action: Type docease-v2.netlify.app into the "Page address" field
  4. Action: Click the "Scan URL" button
  5. Assertion: The "Page address" field shows the error "Enter a full address starting with https://"

---

## Signed-in scanning (demo account)

Each case signs in itself, with the test account's credentials from the portal.

### U7 · Signing in with the demo account opens the dashboard

- **Priority:** High
- **Description:** The seeded, verified demo account signs in and lands on its dashboard.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Assertion: A heading starting with "Welcome," is shown

### U8 · A signed-in URL scan of docease-v2 renders in a real browser

- **Priority:** High
- **Description:** Signed in, a URL is loaded in a real browser, so all 17 rules run and a screenshot is saved. The scan takes several seconds; the report opens when it's done.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Click the "Scan a page" link
  6. Action: Click the "URL" tab
  7. Action: Type https://docease-v2.netlify.app into the "Page address" field
  8. Action: Click the "Scan URL" button
  9. Assertion: The report shows a "Rendered" badge
  10. Assertion: The report has a "Page screenshot" section

### U9 · Making a signed-in scan public updates its visibility

- **Priority:** Medium
- **Description:** A signed-in user's scan starts private, and its owner can make it public.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Click the "Scan a page" link
  6. Action: Click the "Load example Perfect page" button
  7. Assertion: The report's visibility badge reads "Private"
  8. Action: Click the "Make scan public" button
  9. Assertion: The report's visibility badge reads "Public" (the badge, not the "Make scan private" button)

### U10 · Deleting a scan from its report returns to the Scans page

- **Priority:** Medium
- **Description:** The owner deletes a scan from its report, confirms, and lands on their scan history.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Click the "Scan a page" link
  6. Action: Click the "Load example OPT-101 fixed" button
  7. Action: Click the "Delete scan" button on the report
  8. Action: Click the "Delete scan" button in the confirmation dialog, not the one on the report
  9. Assertion: The page heading reads "Scans"
