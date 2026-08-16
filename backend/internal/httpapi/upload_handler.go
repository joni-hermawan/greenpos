package httpapi

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"greenpos-backend/internal/apperror"
)

// maxUploadBytes caps a single image upload — generous enough for a phone
// photo of a product or a merchant logo, small enough that the local JSON
// file "database" directory doesn't balloon from a handful of uploads.
const maxUploadBytes = 5 << 20 // 5MB

var allowedUploadExt = map[string]bool{
	".png": true, ".jpg": true, ".jpeg": true, ".webp": true, ".gif": true,
}

// handleUpload accepts a single multipart image file (field name "file")
// and stores it under the server's uploads directory, returning a URL the
// caller embeds directly as a product's imageUrl or a merchant's logoUrl —
// the same plain string field either an uploaded file or an external URL
// (e.g. today's seed/demo data) can fill, so nothing downstream needs to
// know or care which one it is.
//
// Deliberately requireAuth-only, not permission-gated: uploading a file by
// itself never mutates business data, it just stores bytes and hands back
// a URL — the real authorization happens wherever that URL then gets
// saved (POST/PUT product, merchant, etc.), which already checks the
// right menu permission.
func (s *Server) handleUpload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		writeError(w, apperror.BadRequest("File terlalu besar (maks 5MB)."))
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, apperror.BadRequest("File tidak ditemukan."))
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedUploadExt[ext] {
		writeError(w, apperror.BadRequest("Format file tidak didukung. Gunakan PNG, JPG, WEBP, atau GIF."))
		return
	}

	filename := randomFilename() + ext
	dst, err := os.Create(filepath.Join(s.uploadsDir, filename))
	if err != nil {
		writeError(w, apperror.Internal("Gagal menyimpan file."))
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		writeError(w, apperror.Internal("Gagal menyimpan file."))
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"url": "/uploads/" + filename})
}

func randomFilename() string {
	buf := make([]byte, 12)
	_, _ = rand.Read(buf)
	return "upload-" + hex.EncodeToString(buf)
}
