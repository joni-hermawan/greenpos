// Package config loads backend configuration from environment variables,
// optionally pre-populated from a .env file in the working directory.
package config

import (
	"bufio"
	"crypto/rand"
	"encoding/base64"
	"log"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	Port              string
	DataDir           string
	TokenTTLHrs       int
	JWTSecret         string
	MidtransEnv       string
	MidtransKey       string
	MidtransClientKey string

	EDCMode              string // "simulator" | "live"
	EDCWSURL             string
	EDCAPIKey            string
	EDCClientCertPath    string
	EDCClientKeyPath     string
	EDCRootCAPath        string
	EDCSigningKeyPath    string
}

// Load reads .env (if present) into the process environment without
// overriding anything already set, then builds a Config from env vars with
// sane defaults. No third-party dependency — just a tiny KEY=VALUE reader.
func Load() Config {
	loadDotEnv(".env")

	return Config{
		Port:              getEnv("PORT", "8080"),
		DataDir:           getEnv("DATA_DIR", "./data"),
		TokenTTLHrs:       getEnvInt("TOKEN_TTL_HOURS", 12),
		JWTSecret:         getJWTSecret(),
		MidtransEnv:       getEnv("MIDTRANS_ENV", "sandbox"),
		MidtransKey:       getEnv("MIDTRANS_SERVER_KEY", ""),
		MidtransClientKey: getEnv("MIDTRANS_CLIENT_KEY", ""),

		EDCMode:           getEnv("EDC_MODE", "simulator"),
		EDCWSURL:          getEnv("EDC_WS_URL", ""),
		EDCAPIKey:         getEnv("EDC_API_KEY", ""),
		EDCClientCertPath: getEnv("EDC_CLIENT_CERT_PATH", ""),
		EDCClientKeyPath:  getEnv("EDC_CLIENT_KEY_PATH", ""),
		EDCRootCAPath:     getEnv("EDC_ROOT_CA_PATH", ""),
		EDCSigningKeyPath: getEnv("EDC_SIGNING_PRIVATE_KEY_PATH", ""),
	}
}

func (c Config) MidtransConfigured() bool {
	return strings.TrimSpace(c.MidtransKey) != ""
}

func (c Config) EDCLive() bool {
	return strings.EqualFold(c.EDCMode, "live")
}

func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

// getJWTSecret reads JWT_SECRET from the environment, or generates a
// random one for this process if unset. Since sessions are already
// in-memory only (server restart = re-login regardless), a fresh secret
// per restart doesn't change that behavior — but set JWT_SECRET in .env
// for a stable value if you ever want to verify tokens from a separate
// process/tool.
func getJWTSecret() string {
	if v, ok := os.LookupEnv("JWT_SECRET"); ok && v != "" {
		return v
	}
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		log.Fatalf("config: failed to generate a random JWT secret: %v", err)
	}
	secret := base64.RawURLEncoding.EncodeToString(buf)
	log.Printf("JWT_SECRET not set — generated a random one for this run (set JWT_SECRET in .env for a stable secret across restarts)")
	return secret
}

func getEnvInt(key string, fallback int) int {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
