# sbrep2. DOM Traversal

sbrep2. DOM Traversal adalah aplikasi web untuk melakukan traversal DOM dari sebuah halaman web atau raw HTML menggunakan algoritma BFS atau DFS. Backend menerima URL/HTML dan CSS selector, lalu mengembalikan tree DOM, daftar node yang dikunjungi, node yang match, statistik traversal, dan file log. Frontend menampilkan hasil traversal dalam bentuk visualisasi tree interaktif.

## Algoritma

### Breadth First Search (BFS)

BFS menelusuri tree DOM secara melebar dari root. Setiap node pada level yang sama dikunjungi lebih dulu sebelum traversal lanjut ke level berikutnya.

Contoh urutan traversal:

```txt
root
+-- child 1
+-- child 2
+-- child 3
```

BFS akan mengunjungi `root`, lalu `child 1`, `child 2`, dan `child 3`. Pada program ini, BFS cocok digunakan saat pencarian ingin memprioritaskan node yang lebih dekat dengan root DOM.

### Depth First Search (DFS)

DFS menelusuri tree DOM secara mendalam. Dari suatu node, traversal akan masuk ke child terdalam terlebih dahulu sebelum kembali ke sibling berikutnya.

Contoh urutan traversal:

```txt
root
+-- child
    +-- grandchild
```

DFS akan mengunjungi `root`, lalu `child`, lalu `grandchild`. Pada program ini, DFS cocok digunakan saat pencarian ingin mengikuti satu cabang DOM sampai selesai sebelum pindah ke cabang lain.

## Requirement

Pastikan perangkat sudah memiliki:

- Go sesuai versi `go.mod` backend, yaitu Go `1.25.0` atau versi kompatibel.
- Node.js dan npm untuk menjalankan frontend React.
- Browser modern seperti Chrome, Edge, Firefox, atau Safari.

Dependency backend:

- `github.com/rs/cors`
- `golang.org/x/net`

Dependency frontend utama:

- React
- React DOM
- React Scripts

## Instalasi

Clone atau buka folder proyek, lalu install dependency frontend:

```bash
cd Tubes2_sbrep2_FE
npm install
```

Dependency backend dapat diunduh otomatis oleh Go saat build/run:

```bash
cd ../Tubes2_sbrep2_BE
go mod download
```

## Menjalankan Program

Jalankan backend terlebih dahulu:

```bash
cd Tubes2_sbrep2_BE
go run main.go
```

Backend berjalan pada:

```txt
http://localhost:8080
```

Lalu jalankan frontend di terminal lain:

```bash
cd Tubes2_sbrep2_FE
npm start
```

Frontend akan terbuka pada:

```txt
http://localhost:3000
```

## Build Program

Build backend:

```bash
cd Tubes2_sbrep2_BE
go build -o sbrep2-backend.exe .
```

Build frontend:

```bash
cd Tubes2_sbrep2_FE
npm run build
```

Hasil build frontend akan berada pada folder:

```txt
Tubes2_sbrep2_FE/build
```

## Cara Penggunaan

1. Jalankan backend dan frontend.
2. Pilih input mode:
   - `Website URL` untuk memasukkan URL website.
   - `Raw HTML` untuk memasukkan HTML secara langsung.
3. Pilih algoritma traversal:
   - `BFS`
   - `DFS`
4. Masukkan CSS selector yang ingin dicari.
5. Pilih result mode:
   - `Top N` untuk membatasi jumlah match.
   - `All` untuk mengambil semua match.
6. Klik tombol `Go`.
7. Lihat hasil traversal pada visualisasi tree, traversal log, dan report di sidebar.
8. Jika tersedia, klik `Download Traversal log` untuk mengunduh log traversal.

Contoh CSS selector:

```txt
h1
.class-name
#element-id
input#collections
[href]
a[href*="google"]
```

## Author

- Ishak Palentino Napitupulu - 13524022
- Richard Samuel Simanullang - 13524112
- Dylan Gregory Tondang - 13524118
