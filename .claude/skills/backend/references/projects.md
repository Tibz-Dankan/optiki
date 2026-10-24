# Projects

A project is an optional label that groups a user's scans: a site, an app, a repository. Nothing requires one. A scan without a project is complete on its own, and anonymous scans never have one.

Projects are created from the dashboard (session) or by an API token with `project:create:own`. They always belong to the **user**; a token that creates one is recorded in `apiTokenID`, for history only. Tokens are never scoped to a project.

The table is in `data-model.md`.

## Endpoints

| Method · path | Browser middleware | Token middleware | Handler |
|---|---|---|---|
| `POST /project` | `Auth → VerifiedEmail` | `AuthAPI → RequirePermission(project:create:own)` | `CreateProject` |
| `GET /project` | `Auth → VerifiedEmail` | `AuthAPI → RequirePermission(project:view:own)` | `GetProjects` |
| `GET /project/:id` | `Auth → VerifiedEmail` | `AuthAPI → RequirePermission(project:view:own)` | `GetProject` |
| `PATCH /project/:id` | `Auth → VerifiedEmail` | `AuthAPI → RequirePermission(project:edit:own)` | `UpdateProject` |
| `DELETE /project/:id` | `Auth → VerifiedEmail` | `AuthAPI → RequirePermission(project:delete:own)` | `DeleteProject` |

The prefixes are `/api/v1/project` and `/client/v1/project`, with the same handlers in `handlers/project/` on both.

## Input and validation

```go
type CreateProjectInput struct {
	Name        string  `json:"name"`
	Description *string `json:"description"`
	BaseURL     *string `json:"baseURL"`
	Repository  *string `json:"repository"`
}
```

`UpdateProjectInput` has the same fields, all pointers. Only the provided ones change, and `""` clears an optional field.

| Field | Rule |
|---|---|
| `name` | trimmed, 1–64 characters, unique per owner. A duplicate is 409 "You already have a project named …" |
| `description` | at most 280 characters |
| `baseURL` | absolute `http`/`https`. Stored as given and **never fetched on save**; scanning it later goes through the scan pipeline's SSRF checks |
| `repository` | `owner/name` (GitHub's character set), at most 140 characters |

`createdVia` is `API_TOKEN` when the `apiToken` local is set, which also sets `apiTokenID`. Otherwise it is `WEB`.

## Ownership

- Every query is `"userID" = <caller>`.
- Another user's project is a **404**, the same as a missing one, on every endpoint. That includes a `projectID` passed to `POST /scan` or `PATCH /scan/:id`.

## Reads

`GET /project/:id` returns the project plus three computed values:

```json
{
  "status": "success",
  "data": {
    "id": "…", "name": "Marketing site", "description": null,
    "baseURL": "https://example.com", "repository": "acme/site",
    "createdVia": "WEB", "createdAt": "…", "updatedAt": "…",
    "scansCount": 12, "lastScannedAt": "…", "latestOverallScore": 91
  }
}
```

- The stats come from one aggregate query over the project's `COMPLETED` scans.
- `latestOverallScore` is the newest completed scan's `overallScore`, or `null` when there is none.
- The project's scans are listed with `GET /scan?projectID=<id>`, not nested here.
- `GET /project` is the standard cursor list (`limit+1`, `createdAt` cursor), newest first. Its items carry the same three stats.

## Delete

`DELETE /project/:id` removes the project. Its scans stay in the owner's history with `projectID = NULL` (`ON DELETE SET NULL`). Deleting history is a separate action: `DELETE /scan/:id`.

## Files

```
handlers/project/  createProject.go  getProjects.go  getProject.go  updateProject.go  deleteProject.go
                   projectResponseData.go  validateProjectInput.go
models/project.go  Create, FindOne(id, userID), FindAllByUser(limit, cursor), Update, Delete, Stats(ids)
```
