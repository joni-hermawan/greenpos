package domain

type Store struct {
	ID         string `json:"id"`
	MerchantID string `json:"merchantId"`
	Name       string `json:"name"`
	Address    string `json:"address"`
	Active     bool   `json:"active"`
}
