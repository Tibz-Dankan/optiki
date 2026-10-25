# Attachments (scan screenshots in S3)

Rendered scans capture a screenshot of the page as Chromium saw it. The server uploads it to a private S3 bucket and records an `attachments` row. Every read of the scan returns a **fresh presigned GET URL valid for 30 minutes**.

The design is ported from gradescript's server-generated-file path: `handlers/grading/generateGradedFile.go`, `pkg/s3.go` and `apihandlers/v1/grading/signGradingAttachments.go`. Its known bugs are fixed; see the last section.

## Where the pieces live

| Piece | File |
|---|---|
| S3 client | `pkg/s3.go`: `S3Configured()`, `S3()` (a `sync.Once` singleton), `PutObject`, `DeleteObject`, `PresignGet` |
| Table | `models/schema.go` → `Attachment`, plus `Scan.ScreenshotAttachmentID` (FK, `ON DELETE SET NULL`) |
| Capture | `snapshot/rendered/build.go` → `captureScreenshot` (JPEG q80, 1280 wide, height `min(scrollHeight, 6000)`, at least 800) |
| Upload + link | `handlers/scan/runScan.go` → `storeScreenshot`, then `models.Scan.Complete` creates the row and sets the FK in the same transaction |
| Sign on read | `handlers/scan/signScreenshots.go` → `screenshotData`, called by `scanSummaryData` for create, get-one and every list item |
| Delete | `models.Scan.Delete` returns the attachment; `handlers/scan/deleteScan.go` then deletes the object |

## The table

```go
type Attachment struct {
	ID          string    `gorm:"column:id;type:uuid;primaryKey" json:"id"`
	UserID      *string   `gorm:"column:userID;type:uuid;default:null;index" json:"userID"`
	Type        string    `gorm:"column:type;not null;index" json:"type"` // SCAN_SCREENSHOT
	Key         string    `gorm:"column:key;size:255;not null;uniqueIndex" json:"-"`
	ContentType string    `gorm:"column:contentType;size:64;not null" json:"contentType"`
	Size        int64     `gorm:"column:size;not null" json:"size"`
	Width       *int      `gorm:"column:width;default:null" json:"width"`
	Height      *int      `gorm:"column:height;default:null" json:"height"`
	CreatedAt   time.Time `gorm:"column:createdAt;index" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"column:updatedAt;index" json:"updatedAt"`
	// Relationships: User (CASCADE)
}
```

- The **key** is `scan-screenshots/<scanID>.jpg`. It's deterministic, so it is unique per scan and easy to find. It is `json:"-"`; clients only ever get presigned URLs.
- **The bucket is private.** There is no ACL, no public URL, and no URL stored in the database. A URL exists only in a response, and only for 30 minutes.
- Only server-generated files exist today. There are no user uploads, no multipart, and no presigned PUT. If uploads are ever added, they are a new design (gradescript's presigned PUT + confirm flow), not a reuse of this path.

## The rules

1. **A screenshot never fails a scan.** Without S3 configured, `storeScreenshot` logs once ("S3 isn't configured…") and the scan completes with `screenshot: null`. An upload error is logged and the scan completes without a screenshot.
2. **Upload first, then link in one transaction.** `Complete` inserts the attachment and sets `screenshotAttachmentID` together with the results and findings. If that transaction fails, the handler deletes the uploaded object.
3. **Sign on every read, never store the URL.** `PresignGet` signs locally, with no network call, so signing every item on a list page is cheap. A signing failure drops the screenshot from that one response (`null`) and logs.
4. **Say when it expires.** The response carries `expiresAt`, so the client can refetch before the link dies. The report page refetches every 25 minutes.
5. **Delete the object when the scan is deleted.** That happens after the database transaction, best-effort, and is logged on failure. S3 deletes are idempotent, so there is no HEAD first.

Response shape:

```json
"screenshot": {
  "id": "…", "url": "https://bucket.s3.region.amazonaws.com/scan-screenshots/<scanID>.jpg?X-Amz-…&X-Amz-Expires=1800…",
  "expiresAt": "2026-10-25T01:53:13Z", "contentType": "image/jpeg", "size": 60138, "width": 1280, "height": 800
}
```

## Configuration

| Variable | Notes |
|---|---|
| `S3_ACCESS_KEY_ID`, `S3_ACCESS_KEY`, `S3_BUCKET_NAME`, `AWS_REGION` | all four, or no screenshots (the same names as gradescript) |
| `S3_ENDPOINT` | optional, for an S3-compatible store (MinIO, R2, Spaces) |
| `S3_USE_PATH_STYLE` | `true` for stores that need path-style addressing |

The bucket needs no CORS rules: browsers load presigned GETs in `<img>` tags and links, which aren't CORS requests.

## What changed from gradescript, and why

| gradescript | optikí |
|---|---|
| A new S3 client (and a full `LoadDefaultConfig`) on every request | one client per process (`sync.Once`) |
| The error names `S3_REGION`, but the code reads `AWS_REGION` | the error names exactly the variables read |
| `AddFile` returns a permanent, AWS-only URL that 403s on a private bucket | no permanent URL at all |
| Two GET-presign methods with different expiries (15 and 30 min) | one `PresignGet(key, expiry)`; scans use `SCAN_SCREENSHOT_URL_EXPIRY` (30 min) |
| No `expiresAt` in responses | `expiresAt` on every screenshot |
| `DeleteFile` does a HEAD first, which 403s without `s3:ListBucket` | plain idempotent `DeleteObject` |
| User or org deletes leak S3 objects | scan deletes remove the object (a user delete would still leak; there is no user-delete endpoint) |
| No custom endpoint support | `S3_ENDPOINT` + `S3_USE_PATH_STYLE` |

## Testing

- `S3()` and `PresignGet` have no unit test; they're outside the test allowlist and need credentials.
- They were verified offline with dummy credentials: `X-Amz-Expires=1800`, and `expiresAt` 30 minutes out.
- The upload → link → sign → delete flow was verified against a local stub through `S3_ENDPOINT`.
- **Real AWS uploads have not been exercised yet.** Do that once after deploying.
