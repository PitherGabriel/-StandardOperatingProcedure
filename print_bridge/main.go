//go:build windows

package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"syscall"
	"unsafe"
)

var (
	winspool     = syscall.NewLazyDLL("winspool.drv")
	openPrinter  = winspool.NewProc("OpenPrinterW")
	startDoc     = winspool.NewProc("StartDocPrinterW")
	startPage    = winspool.NewProc("StartPagePrinter")
	writePrinter = winspool.NewProc("WritePrinter")
	endPage      = winspool.NewProc("EndPagePrinter")
	endDoc       = winspool.NewProc("EndDocPrinter")
	closePrinter = winspool.NewProc("ClosePrinter")
)

type docInfo1 struct {
	pDocName    *uint16
	pOutputFile *uint16
	pDatatype   *uint16
}

func printRaw(printerName string, data []byte) error {
	pName, _ := syscall.UTF16PtrFromString(printerName)
	var hPrinter uintptr
	r, _, err := openPrinter.Call(uintptr(unsafe.Pointer(pName)), uintptr(unsafe.Pointer(&hPrinter)), 0)
	if r == 0 {
		return err
	}
	defer closePrinter.Call(hPrinter)

	docName, _ := syscall.UTF16PtrFromString("Receipt")
	datatype, _ := syscall.UTF16PtrFromString("RAW")
	di := docInfo1{pDocName: docName, pDatatype: datatype}
	r, _, err = startDoc.Call(hPrinter, 1, uintptr(unsafe.Pointer(&di)))
	if r == 0 {
		return err
	}
	defer endDoc.Call(hPrinter)

	r, _, err = startPage.Call(hPrinter)
	if r == 0 {
		return err
	}
	defer endPage.Call(hPrinter)

	var written uint32
	r, _, err = writePrinter.Call(
		hPrinter,
		uintptr(unsafe.Pointer(&data[0])),
		uintptr(len(data)),
		uintptr(unsafe.Pointer(&written)),
	)
	if r == 0 {
		return err
	}
	return nil
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func respond(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func main() {
	printer := os.Getenv("PRINTER_NAME")
	if printer == "" {
		printer = "POS-80C"
	}
	port := os.Getenv("BRIDGE_PORT")
	if port == "" {
		port = "6543"
	}

	http.HandleFunc("/health", withCORS(func(w http.ResponseWriter, r *http.Request) {
		respond(w, http.StatusOK, map[string]any{"ok": true, "printer": printer})
	}))

	http.HandleFunc("/print", withCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			respond(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
			return
		}
		data, err := io.ReadAll(r.Body)
		if err != nil || len(data) == 0 {
			respond(w, http.StatusBadRequest, map[string]any{"error": "no data"})
			return
		}
		if err := printRaw(printer, data); err != nil {
			respond(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		respond(w, http.StatusOK, map[string]any{"ok": true})
	}))

	addr := "127.0.0.1:" + port
	log.Printf("Print bridge  →  http://%s", addr)
	log.Printf("Printer name  →  %s", printer)
	log.Fatal(http.ListenAndServe(addr, nil))
}
