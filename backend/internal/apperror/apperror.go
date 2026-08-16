// Package apperror is a small structured error type carrying an HTTP status
// code, shared by the service and httpapi layers so handlers never have to
// guess what status a service-layer failure should map to.
package apperror

import "net/http"

type Error struct {
	Status  int
	Message string
}

func (e *Error) Error() string { return e.Message }

func New(status int, message string) *Error {
	return &Error{Status: status, Message: message}
}

func BadRequest(message string) *Error    { return New(http.StatusBadRequest, message) }
func Unauthorized(message string) *Error  { return New(http.StatusUnauthorized, message) }
func Forbidden(message string) *Error     { return New(http.StatusForbidden, message) }
func NotFound(message string) *Error      { return New(http.StatusNotFound, message) }
func Internal(message string) *Error      { return New(http.StatusInternalServerError, message) }

// As unwraps err into *Error if possible, returning ok=false otherwise so
// callers can fall back to a generic 500.
func As(err error) (*Error, bool) {
	e, ok := err.(*Error)
	return e, ok
}
