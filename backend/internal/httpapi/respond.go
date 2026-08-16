package httpapi

import (
	"encoding/json"
	"log"
	"net/http"

	"greenpos-backend/internal/apperror"
)

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if v != nil {
		_ = json.NewEncoder(w).Encode(v)
	}
}

// writeError maps a service-layer error to its HTTP status via
// apperror.As, falling back to a generic 500 for anything unexpected.
func writeError(w http.ResponseWriter, err error) {
	if appErr, ok := apperror.As(err); ok {
		writeJSON(w, appErr.Status, map[string]string{"message": appErr.Message})
		return
	}
	log.Printf("httpapi: unhandled error: %v", err)
	writeJSON(w, http.StatusInternalServerError, map[string]string{"message": "Terjadi kesalahan pada server."})
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(v)
}
