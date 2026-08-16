package domain

// EDCTerminal is one physical EDC device paired to a store — a store can
// have several (multiple checkout counters, each with its own machine).
// Per the TSD integration spec §2.4/§3.1.1, "the relationship between EDC
// and POS can be many-to-many"; this models the POS side of that pairing.
type EDCTerminal struct {
	ID      string `json:"id"`
	StoreID string `json:"storeId"`
	// Label is a human-friendly name for the mapping dashboard/picker —
	// "Kasir 1", "Meja Depan" — since MID+StationCode alone isn't
	// meaningful to a person scanning a list of terminals.
	Label string `json:"label"`

	Mode   string `json:"mode"` // "simulator" | "live"
	WSURL  string `json:"wsUrl,omitempty"`
	APIKey string `json:"apiKey,omitempty"`
	MID    string `json:"mid,omitempty"`
	// StationCode is the 2-character code the merchant assigns itself per
	// terminal (not issued by a bank or Prima Vista) — embedded as the
	// "xx" suffix of the 14-digit transaction id (YYMMDDHHMMSSxx) so the
	// middleware can tell which till a transaction came from, and folded
	// into this terminal's simplified pos_id (MID+StationCode) for the
	// POS<->EDC pairing handshake. Only needs to be unique among this
	// merchant's own terminals sharing the same MID.
	StationCode string `json:"stationCode,omitempty"`

	Active bool `json:"active"`
}

// PosID is the identifier this terminal presents to the EDC middleware
// during pairing/registration — format <<mid>><<serial_number>> per spec
// §3.1.1, using StationCode as a simplified stand-in for serial_number.
func (t EDCTerminal) PosID() string {
	return t.MID + t.StationCode
}
