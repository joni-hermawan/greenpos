package service

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
)

// newToken produces an opaque bearer session token: 32 random bytes,
// base64url-encoded, per the plan's "no JWT dependency needed" auth design.
func newToken() string {
	buf := make([]byte, 32)
	_, _ = rand.Read(buf)
	return base64.RawURLEncoding.EncodeToString(buf)
}

// newID produces a short, collision-resistant entity id ("trx-9f2a1c3e...").
func newID(prefix string) string {
	buf := make([]byte, 8)
	_, _ = rand.Read(buf)
	return prefix + "-" + hex.EncodeToString(buf)
}
