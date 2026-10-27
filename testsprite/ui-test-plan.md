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

Scanning takes a page address only. Two kinds of address are scanned:

- **The Gym's fixture pages**, by URL, for example `https://optikiapi.tuliime.com/gym/pages/opt-101-broken.html`. They are served by the production API, which a PR preview also calls.
- **`https://docease-v2.netlify.app`**, a client-rendered app whose raw HTML is an empty shell. Signed out, it's fetched and scanned statically; signed in, it's rendered in a real browser and screenshotted.

Each case runs in a fresh browser. A signed-out browser gets 3 free scans, and no case makes more than one.

Every case asserts on the scan it just created, never on history order or counts: the production database is shared and never reset.

---

## Signed-out scanning

### U1 · Scanning the OPT-101 broken Gym page fails OPT-101 and shows how to fix it

- **Priority:** High
- **Description:** A signed-out visitor scans the Gym's broken OPT-101 page. The report marks OPT-101 as failed and its finding explains the fix with before and after code.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type https://optikiapi.tuliime.com/gym/pages/opt-101-broken.html into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: The OPT-101 rule in the report shows the result "Fail"
  5. Action: Click "How to fix OPT-101"
  6. Assertion: A code example titled "Expected" is visible

### U2 · Scanning the OPT-101 fixed Gym page passes OPT-101

- **Priority:** High
- **Description:** A signed-out visitor scans the Gym's fixed OPT-101 page, and the rule passes.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type https://optikiapi.tuliime.com/gym/pages/opt-101-fixed.html into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: The OPT-101 rule in the report shows the result "Pass"

### U3 · Scanning the Perfect Gym page scores 100

- **Priority:** Medium
- **Description:** The Gym's perfect page has no problems, so its report scores 100.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type https://optikiapi.tuliime.com/gym/pages/perfect.html into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: The number shown above "Overall score" is 100

### U4 · A signed-out URL scan of docease-v2 runs statically with the 9 core rules

- **Priority:** High
- **Description:** Signed out, a URL is fetched without a browser and scanned with the 9 core rules. The report says so.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type https://docease-v2.netlify.app into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: The report shows a "Static" badge
  5. Assertion: The report shows a notice starting "Ran the 9 core rules."

### U5 · Scanning a private address shows "This address isn't allowed"

- **Priority:** High
- **Description:** Addresses on private or loopback networks are refused before anything is fetched.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type http://127.0.0.1 into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: An alert reads "This address isn't allowed"

### U6 · An address without https:// is rejected before scanning

- **Priority:** Low
- **Description:** The scan form only accepts full addresses, and says how to fix one that isn't.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type docease-v2.netlify.app into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: The "Page address" field shows the error "Enter a full address starting with https://"

### U11 · A signed-out scan's report asks the visitor to sign in to keep their history

- **Priority:** Medium
- **Description:** Signed out, scans are kept only in the browser. The report says so and links to sign-in, where they move to the visitor's account.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type https://optikiapi.tuliime.com/gym/pages/perfect.html into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: A notice starting "Your scans are saved in this browser only." is shown

### U13 · A scan with findings gets a fix report for coding agents

- **Priority:** Medium
- **Description:** Every completed scan with findings gets a fix report: a prompt, written by Gemini in the background, that the visitor pastes into a coding agent. The report page shows the "Fix report" section at once, while the prompt is generated. The case asserts only on the section, never on Gemini's text, which differs from run to run. It needs `GEMINI_API_KEY` on the production server.
- **Steps:**
  1. Action: Navigate to /scan
  2. Action: Type https://optikiapi.tuliime.com/gym/pages/opt-102-broken.html into the "Page address" field
  3. Action: Click the "Scan" button
  4. Assertion: A section headed "Fix report" is visible below the scores

---

## Signed-in scanning (demo account)

Each case signs in itself, with the test account's credentials from the portal.

### U7 · Signing in with the demo account opens the scan page

- **Priority:** High
- **Description:** The seeded, verified demo account signs in and lands on the signed-in scan page, which renders URLs in a real browser.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Assertion: The text "All 17 rules" is shown

### U8 · A signed-in URL scan of docease-v2 renders in a real browser

- **Priority:** High
- **Description:** Signed in, a URL is loaded in a real browser, so all 17 rules run and a screenshot is saved. The scan takes several seconds; the report opens when it's done.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Type https://docease-v2.netlify.app into the "Page address" field
  6. Action: Click the "Scan" button
  7. Assertion: The report shows a "Rendered" badge
  8. Assertion: The report shows a screenshot of the scanned page

### U9 · Making a signed-in scan public updates its visibility

- **Priority:** Medium
- **Description:** A signed-in user's scan starts private, and its owner can make it public from the report's actions menu.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Type https://optikiapi.tuliime.com/gym/pages/perfect.html into the "Page address" field
  6. Action: Click the "Scan" button
  7. Assertion: The report's visibility badge reads "Private"
  8. Action: Click the "Scan actions" button
  9. Action: Click the "Make scan public" menu item
  10. Action: Click the "Make scan public" button in the confirmation dialog
  11. Assertion: The report's visibility badge reads "Public"

### U10 · Deleting a scan from its report returns to the Scans page

- **Priority:** Medium
- **Description:** The owner deletes a scan from the report's actions menu, confirms, and lands on their scan history.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Type https://optikiapi.tuliime.com/gym/pages/opt-101-fixed.html into the "Page address" field
  6. Action: Click the "Scan" button
  7. Action: Click the "Scan actions" button
  8. Action: Click the "Delete scan" menu item
  9. Action: Click the "Delete scan" button in the confirmation dialog
  10. Assertion: The page heading reads "Scans"

### U12 · A signed-in multiple-page scan lists the pages it scanned

- **Priority:** High
- **Description:** Signed in, ticking "Automatically discover and scan other pages on this site" crawls the site from the address and scans each public page it links to, up to 25, in the background. Its report page fills in as each page finishes, so the first scanned page appears within seconds.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Type https://docease-v2.netlify.app into the "Page address" field
  6. Action: Click the "Automatically discover and scan other pages on this site" checkbox
  7. Action: Click the "Scan" button
  8. Assertion: The "Scanned pages" table lists the page "/"

The portal's generated case "Scan a page with multi-page discovery enabled" is this case. Keep its steps the same as these: its start page must answer 200. `https://optikiapi.tuliime.com/` and `https://optikiapi.tuliime.com/gym/pages/` answer 404, so a scan from either stops after 0 pages.

### U14 · Editing an API token renames it and changes its permissions

- **Priority:** Medium
- **Description:** The owner renames an API token and grants it another permission. The table shows the new name and permission. The case creates its own token and deletes it at the end. The account is shared by cases that run at the same time, so the case acts only on the token it named, and the deletion keeps leftovers under the 25-active-token limit. Other token cases must likewise touch only the tokens they create.
- **Steps:**
  1. Action: Navigate to /auth/signin?redirectTo=/u/settings/api-tokens
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Click the "Create API token" button
  6. Action: Type QA edit test into the "Token name" field
  7. Action: Click the "Create token" button
  8. Action: Click the "I've saved my token" button
  9. Action: Click the "Actions for token QA edit test" button
  10. Action: Click the "Edit token QA edit test" menu item
  11. Action: Clear the "Token name" field
  12. Action: Type QA edit test updated into the "Token name" field
  13. Action: Tick the "Edit scans" checkbox
  14. Action: Click the "Save token" button
  15. Assertion: The API tokens table has a row named "QA edit test updated" that shows an "Edit scans" badge
  16. Action: Click the "Actions for token QA edit test updated" button
  17. Action: Click the "Delete token QA edit test updated" menu item
  18. Action: Click the "Delete token" button in the confirmation dialog

### U15 · A signed-in rendered scan shows its progress until the report opens

- **Priority:** Low
- **Description:** While a scan runs, the Scan button is disabled and a status line says it's scanning. A static Gym scan finishes in milliseconds, too fast to see, so this case scans docease-v2 signed in. That rendered scan takes several seconds. Step 7 is the only assertion on a passing state; step 8 asserts the settled report.
- **Steps:**
  1. Action: Navigate to /auth/signin
  2. Action: Type the test account's email into the "Email" field
  3. Action: Type the test account's password into the "Password" field
  4. Action: Click the "Sign in" button
  5. Action: Type https://docease-v2.netlify.app into the "Page address" field
  6. Action: Click the "Scan" button
  7. Assertion: A status reads "Scanning… rendered scans take a few seconds." and the "Scan" button is disabled
  8. Assertion: The report shows a "Rendered" badge
