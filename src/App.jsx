import { useState } from "react";

// Rotasi kecil (dalam derajat) untuk tiap kotak (index 0-8).
// Dipakai lewat CSS variable --tilt supaya kotak kelihatan miring
// sedikit, kesannya digambar tangan pakai kapur, bukan digaris lurus.
const SQUARE_TILT = [-2, 1, -1.5, 2, 0, -1, 1.5, -2, 1.5];

// SQUARE: komponen 1 kotak/tombol (isinya "X", "O", atau kosong)
function Square({ value, onSquare, isWinning, index }) {
  return (
    <button
      // className digabung secara dinamis:
      // - "square" selalu ada (style dasar kotak)
      // - "square--win" ditambahkan kalau kotak ini bagian dari garis pemenang
      // - "square--x" / "square--o" ditambahkan sesuai isi kotak, biar X dan O
      //   bisa dikasih warna berbeda lewat CSS
      className={`square${isWinning ? " square--win" : ""}${
        value ? ` square--${value.toLowerCase()}` : ""
      }`}
      // CSS custom property --tilt diisi dari array SQUARE_TILT sesuai
      // posisi kotak (index). Nilai ini dipakai di styles.css lewat
      // `transform: rotate(var(--tilt))`
      style={{ "--tilt": `${SQUARE_TILT[index]}deg` }}
      // Saat tombol diklik, jalankan fungsi onSquare yang dikirim dari Board
      onClick={onSquare}
    >
      {value}
    </button>
  );
}

// ------------------------------------------------------
// BOARD: papan permainan berisi status giliran + 9 kotak
// ------------------------------------------------------
function Board({ xIsNext, squares, onPlay }) {
  // Dipanggil tiap kali salah satu kotak diklik (index i = 0..8)
  function handleClick(i) {
    // Kalau kotak sudah terisi ATAU game sudah ada pemenang, klik diabaikan
    if (squares[i] || calculateWinner(squares)) return;

    // Bikin salinan array squares (jangan ubah array asli langsung / mutate)
    const nextSquares = squares.slice();

    // Isi kotak yang diklik dengan "X" atau "O" tergantung giliran siapa
    nextSquares[i] = xIsNext ? "X" : "O";

    // Kirim susunan papan yang baru ke komponen induk (Game)
    // supaya tersimpan di history dan trigger re-render
    onPlay(nextSquares);
  }

  // Cek apakah sudah ada pemenang di papan saat ini
  const result = calculateWinner(squares);
  const winner = result ? result.winner : null;       // "X" / "O" / null
  const winningLine = result ? result.line : [];        // contoh: [0, 4, 8]

  // Draw (seri) terjadi kalau tidak ada pemenang TAPI semua kotak sudah terisi
  const isDraw = !winner && squares.every(Boolean);

  // Teks status yang ditampilkan di atas papan, tergantung kondisi:
  // ada pemenang > seri > giliran pemain berikutnya
  const status = winner
    ? `${winner} menang!`
    : isDraw
    ? "Seri! Papan penuh."
    : `Giliran ${xIsNext ? "X" : "O"}`;

  return (
    <>
      {/* Kalau ada pemenang, tambahkan class "status--win" biar warnanya beda */}
      <div className={`status${winner ? " status--win" : ""}`}>{status}</div>

      <div className="board">
        {/* Loop 9 kotak dari array squares. Tiap kotak dapat:
            - value: isi kotak ("X"/"O"/null)
            - onSquare: fungsi yang dijalankan saat diklik
            - isWinning: true kalau index kotak ini ada di dalam winningLine */}
        {squares.map((value, i) => (
          <Square
            key={i}
            index={i}
            value={value}
            onSquare={() => handleClick(i)}
            isWinning={winningLine.includes(i)}
          />
        ))}
      </div>
    </>
  );
}

// ------------------------------------------------------
// GAME: komponen utama. Menyimpan seluruh history permainan
// dan merender Board + daftar riwayat langkah.
// ------------------------------------------------------
export default function Game() {
  // history: array berisi snapshot papan di tiap langkah.
  // Contoh: [ [null x9], [X di index0, sisanya null], ... ]
  // Diawali dengan 1 papan kosong (belum ada yang main).
  const [history, setHistory] = useState([Array(9).fill(null)]);

  // currentMove: menunjukkan kita sedang melihat langkah ke berapa
  // (dipakai untuk fitur "kembali ke langkah sebelumnya")
  const [currentMove, setCurrentMove] = useState(0);

  // Giliran X kalau currentMove genap (0, 2, 4, ...), giliran O kalau ganjil
  const xIsNext = currentMove % 2 === 0;

  // Ambil susunan papan sesuai langkah yang sedang aktif
  const currentSquares = history[currentMove];

  // Dipanggil saat user klik salah satu tombol riwayat ("Langkah #2", dst)
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  // Dipanggil dari Board setiap kali ada kotak yang diklik & berhasil diisi
  function handlePlay(nextSquares) {
    // Ambil history sampai currentMove saja, lalu tambahkan papan baru.
    // Ini penting: kalau user sempat "mundur" ke langkah lama lalu main lagi,
    // history "masa depan" yang lama harus dibuang (tidak nyambung lagi).
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    // Pindah currentMove ke langkah paling baru
    setCurrentMove(nextHistory.length - 1);
  }

  // Reset total: kembalikan history ke 1 papan kosong dan currentMove ke 0
  function resetGame() {
    setHistory([Array(9).fill(null)]);
    setCurrentMove(0);
  }

  // Ubah array history menjadi daftar tombol <li> untuk ditampilkan
  const moves = history.map((squares, move) => {
    // move = 0 artinya kondisi awal (papan kosong)
    const description = move > 0 ? `Langkah #${move}` : "Awal permainan";

    // isCurrent: true kalau tombol ini mewakili langkah yang sedang aktif
    const isCurrent = move === currentMove;

    return (
      <li key={move}>
        <button
          // Tambahkan class "move-btn--active" kalau ini langkah yang aktif,
          // supaya bisa di-highlight beda lewat CSS
          className={`move-btn${isCurrent ? " move-btn--active" : ""}`}
          onClick={() => jumpTo(move)}
        >
          {/* Kasih emoji penanda 📍 di depan teks kalau ini langkah aktif */}
          {isCurrent ? `📍 ${description}` : description}
        </button>
      </li>
    );
  });

  return (
    // .stage = wrapper full-screen buat nge-center-kan seluruh papan
    <div className="stage">
      {/* .frame = bingkai kayu di luar papan */}
      <div className="frame">
        {/* .board-wrap = area hijau tempat papan & teks berada */}
        <div className="board-wrap">
          <h1 className="game-title">Tic Tac Toe</h1>

          {/* Kirim data & fungsi yang dibutuhkan Board sebagai props */}
          <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />

          <button className="reset-btn" onClick={resetGame}>
            🔄 Main Lagi
          </button>

          <div className="game-info">
            <h3>Riwayat Langkah</h3>
            <ol>{moves}</ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------
// calculateWinner: cek apakah ada 3 kotak berurutan yang sama
// isinya (bukan kosong). Kalau ada, itu berarti menang.
// ------------------------------------------------------
function calculateWinner(squares) {
  // Semua kombinasi 3 kotak yang membentuk garis menang:
  // 3 baris, 3 kolom, 2 diagonal
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  // Cek satu per satu tiap kombinasi garis
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];

    // Menang kalau: kotak "a" tidak kosong, DAN
    // kotak a, b, c semuanya berisi nilai yang sama ("X" semua atau "O" semua)
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      // Kembalikan siapa pemenangnya + posisi 3 kotak yang menang
      // (dipakai Board untuk kasih highlight/glow)
      return { winner: squares[a], line: [a, b, c] };
    }
  }

  // Kalau tidak ada satupun garis yang cocok, berarti belum ada pemenang
  return null;
}