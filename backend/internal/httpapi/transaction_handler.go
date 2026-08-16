package httpapi

import (
	"net/http"
	"strconv"
	"time"

	"greenpos-backend/internal/apperror"
	"greenpos-backend/internal/domain"
	"greenpos-backend/internal/service"
)

// Response DTOs below mirror GreenPos/src/types.ts field-for-field so the
// mobile app's existing TS interfaces need zero changes.

type itemDTO struct {
	Name      string `json:"name"`
	Qty       int    `json:"qty"`
	UnitPrice int64  `json:"unitPrice"`
}

func toItemDTOs(items []domain.TransactionItem) []itemDTO {
	out := make([]itemDTO, len(items))
	for i, it := range items {
		out[i] = itemDTO{Name: it.Name, Qty: it.Qty, UnitPrice: it.UnitPrice}
	}
	return out
}

type createdOrderDTO struct {
	ID        string    `json:"id"`
	InvoiceNo string    `json:"invoiceNo"`
	Subtotal  int64     `json:"subtotal"`
	Discount  int64     `json:"discount"`
	PromoName string    `json:"promoName,omitempty"`
	Total     int64     `json:"total"`
	ItemCount int       `json:"itemCount"`
	Items     []itemDTO `json:"items"`
}

type pendingTransactionDTO struct {
	ID          string `json:"id"`
	InvoiceNo   string `json:"invoiceNo"`
	Total       int64  `json:"total"`
	ItemCount   int    `json:"itemCount"`
	CashierName string `json:"cashierName"`
	CreatedAt   string `json:"createdAt"`
	MinutesOpen int    `json:"minutesOpen"`
}

type historyRowDTO struct {
	ID          string `json:"id"`
	InvoiceNo   string `json:"invoiceNo"`
	Total       int64  `json:"total"`
	Status      string `json:"status"`
	Method      string `json:"method"`
	CashierName string `json:"cashierName"`
	CreatedAt   string `json:"createdAt"`
	ItemCount   int    `json:"itemCount"`
	MerchantID  string `json:"merchantId"`
}

type transactionDetailDTO struct {
	ID             string             `json:"id"`
	InvoiceNo      string             `json:"invoiceNo"`
	Subtotal       int64              `json:"subtotal"`
	Discount       int64              `json:"discount"`
	PromoName      string             `json:"promoName,omitempty"`
	Total          int64              `json:"total"`
	Status         string             `json:"status"`
	CreatedAt      string             `json:"createdAt"`
	CashierName    string             `json:"cashierName"`
	StoreName      string             `json:"storeName"`
	StoreAddress   string             `json:"storeAddress"`
	Method         string             `json:"method"`
	AmountReceived *int64             `json:"amountReceived"`
	Meta           *domain.PaymentMeta `json:"meta,omitempty"`
	Items          []itemDTO          `json:"items"`
}

func toDetailDTO(t domain.Transaction) transactionDetailDTO {
	return transactionDetailDTO{
		ID: t.ID, InvoiceNo: t.InvoiceNo, Subtotal: t.Subtotal, Discount: t.Discount,
		PromoName: t.PromoName, Total: t.Total, Status: string(t.Status),
		CreatedAt: t.CreatedAt.Format(time.RFC3339), CashierName: t.CashierName,
		StoreName: t.StoreName, StoreAddress: t.StoreAddress, Method: string(t.Method),
		AmountReceived: t.AmountReceived, Meta: t.Meta, Items: toItemDTOs(t.Items),
	}
}

type createOrderRequest struct {
	Items []struct {
		ProductID string `json:"productId"`
		Qty       int    `json:"qty"`
	} `json:"items"`
}

func (s *Server) handleCreateTransaction(w http.ResponseWriter, r *http.Request) {
	var req createOrderRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, apperror.BadRequest("Body request tidak valid."))
		return
	}
	items := make([]service.CreateOrderItem, len(req.Items))
	for i, it := range req.Items {
		items[i] = service.CreateOrderItem{ProductID: it.ProductID, Qty: it.Qty}
	}

	trx, err := s.svc.Transaction.Create(userFromCtx(r.Context()), items)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, createdOrderDTO{
		ID: trx.ID, InvoiceNo: trx.InvoiceNo, Subtotal: trx.Subtotal, Discount: trx.Discount,
		PromoName: trx.PromoName, Total: trx.Total, ItemCount: trx.ItemCount, Items: toItemDTOs(trx.Items),
	})
}

// storeMerchantMap is only needed for the superadmin "all merchants" view,
// so historyRowDTO can carry which merchant each row belongs to (for the
// Merchant column in the backoffice's Riwayat page).
func (s *Server) storeMerchantMap() map[string]string {
	out := make(map[string]string)
	for _, st := range s.svc.Store.List() {
		out[st.ID] = st.MerchantID
	}
	return out
}

func (s *Server) handleListPending(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	merchantID, _ := resolveMerchantScope(r, user)
	storeIDs, ok := resolveStoreScope(r, user)
	if !ok {
		writeError(w, apperror.Forbidden("Anda tidak memiliki akses ke store ini."))
		return
	}
	list := s.svc.Transaction.ListPending(merchantID, storeIDs)
	out := make([]pendingTransactionDTO, len(list))
	now := time.Now()
	for i, t := range list {
		minutesOpen := int(now.Sub(t.CreatedAt).Minutes())
		if minutesOpen < 1 {
			minutesOpen = 1
		}
		out[i] = pendingTransactionDTO{
			ID: t.ID, InvoiceNo: t.InvoiceNo, Total: t.Total, ItemCount: t.ItemCount,
			CashierName: t.CashierName, CreatedAt: t.CreatedAt.Format(time.RFC3339), MinutesOpen: minutesOpen,
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleListHistory(w http.ResponseWriter, r *http.Request) {
	days := 30
	if d, err := strconv.Atoi(r.URL.Query().Get("days")); err == nil && d > 0 {
		days = d
	}
	user := userFromCtx(r.Context())
	merchantID, all := resolveMerchantScope(r, user)
	storeIDs, ok := resolveStoreScope(r, user)
	if !ok {
		writeError(w, apperror.Forbidden("Anda tidak memiliki akses ke store ini."))
		return
	}
	list := s.svc.Transaction.ListHistory(merchantID, storeIDs, days)
	var storeMerchant map[string]string
	if all {
		storeMerchant = s.storeMerchantMap()
	}
	out := make([]historyRowDTO, len(list))
	for i, t := range list {
		out[i] = historyRowDTO{
			ID: t.ID, InvoiceNo: t.InvoiceNo, Total: t.Total, Status: string(t.Status),
			Method: string(t.Method), CashierName: t.CashierName,
			CreatedAt: t.CreatedAt.Format(time.RFC3339), ItemCount: t.ItemCount,
			MerchantID: storeMerchant[t.StoreID],
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (s *Server) handleTransactionDetail(w http.ResponseWriter, r *http.Request) {
	merchantID, _ := resolveMerchantScope(r, userFromCtx(r.Context()))
	trx, err := s.svc.Transaction.Detail(r.PathValue("id"), merchantID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toDetailDTO(trx))
}

func (s *Server) handleVoidTransaction(w http.ResponseWriter, r *http.Request) {
	user := userFromCtx(r.Context())
	merchantID, _ := resolveMerchantScope(r, user)
	if err := s.svc.Transaction.Void(r.PathValue("id"), merchantID); err != nil {
		writeError(w, err)
		return
	}
	s.svc.Audit.Log(user, "transaction.void", r.PathValue("id"), "")
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
