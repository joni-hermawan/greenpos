// Package storage provides the local JSON-file "database" — a generic
// atomic file-backed store plus one repository per domain entity, each
// keeping an in-memory write-through cache for fast reads.
package storage

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// JSONFile persists a single value of type T as an indented JSON file.
// Writes are atomic: encode to a temp file in the same directory, then
// os.Rename over the destination, so a crash mid-write never corrupts the
// existing file.
type JSONFile[T any] struct {
	path string
}

func NewJSONFile[T any](path string, seed T) (*JSONFile[T], error) {
	f := &JSONFile[T]{path: path}
	if _, err := os.Stat(path); os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			return nil, err
		}
		if err := f.Save(seed); err != nil {
			return nil, err
		}
	}
	return f, nil
}

func (f *JSONFile[T]) Load() (T, error) {
	var v T
	data, err := os.ReadFile(f.path)
	if err != nil {
		return v, err
	}
	if err := json.Unmarshal(data, &v); err != nil {
		return v, err
	}
	return v, nil
}

func (f *JSONFile[T]) Save(v T) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	tmp := f.path + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, f.path)
}
