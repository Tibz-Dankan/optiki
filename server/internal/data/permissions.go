package data

type PermissionSeed struct {
	Name        string
	Description string
}

// APITokenPermissions are the only permissions an API token can be granted.
var APITokenPermissions = []PermissionSeed{
	{Name: "scan:create:own", Description: "Run scans: all 17 rules, with URL scans rendered in a real browser"},
	{Name: "scan:view:own", Description: "List and read your scans"},
	{Name: "scan:edit:own", Description: "Change a scan's title or visibility"},
	{Name: "scan:delete:own", Description: "Delete your scans"},
}

// IsGrantablePermission reports whether a token may hold the named permission.
func IsGrantablePermission(name string) bool {
	for _, permission := range APITokenPermissions {
		if permission.Name == name {
			return true
		}
	}
	return false
}
