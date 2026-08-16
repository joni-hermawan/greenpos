package edc

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"math/big"
)

// SignES256 implements the spec's `signature: Base64URL(ES256(private_key_data))`
// (§2.4): ECDSA using curve P-256 and SHA-256 over the given payload bytes,
// with r/s concatenated into a fixed 64-byte buffer (the JOSE/ES256
// convention) before base64url-encoding — the format any standard JWT/JOSE
// ES256 verifier on the middleware side expects.
func SignES256(privateKey *ecdsa.PrivateKey, payload []byte) (string, error) {
	digest := sha256.Sum256(payload)
	r, s, err := ecdsa.Sign(rand.Reader, privateKey, digest[:])
	if err != nil {
		return "", err
	}

	keyBytes := 32 // P-256 coordinate size
	sig := make([]byte, keyBytes*2)
	r.FillBytes(sig[:keyBytes])
	s.FillBytes(sig[keyBytes:])

	return base64.RawURLEncoding.EncodeToString(sig), nil
}

// VerifyES256 is the receiver-side counterpart, kept for completeness /
// testing the round-trip even though this backend only ever signs outgoing
// requests today.
func VerifyES256(publicKey *ecdsa.PublicKey, payload []byte, signature string) (bool, error) {
	sig, err := base64.RawURLEncoding.DecodeString(signature)
	if err != nil {
		return false, err
	}
	if len(sig) != 64 {
		return false, errors.New("edc: invalid ES256 signature length")
	}
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:])
	digest := sha256.Sum256(payload)
	return ecdsa.Verify(publicKey, digest[:], r, s), nil
}

// LoadECDSAPrivateKeyPEM reads a PKCS#8 or SEC1 EC private key PEM file, as
// produced by Prima Vista's Signature/CSR generation tool (spec §2.4.1).
func LoadECDSAPrivateKeyPEM(pemBytes []byte) (*ecdsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("edc: no PEM block found in signing key file")
	}
	if key, err := x509.ParseECPrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	ecKey, ok := key.(*ecdsa.PrivateKey)
	if !ok || ecKey.Curve != elliptic.P256() {
		return nil, errors.New("edc: signing key is not an ECDSA P-256 private key")
	}
	return ecKey, nil
}
