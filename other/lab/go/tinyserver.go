package main

import (
    "log"
    "net/http"
    "os"
)

func main() {
    root := "."
    if len(os.Args) > 1 {
        root = os.Args[1]
    }

    fs := http.FileServer(http.Dir(root))
    http.Handle("/", fs)

    log.Println("Server started at http://localhost:8080")
    log.Printf("Serving directory: %s\n", root)

    err := http.ListenAndServe(":8080", nil)
    if err != nil {
        log.Fatal(err)
    }
}
