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

  // 2. Create a Category
  const category = await prisma.category.upsert({
    where: { name: 'Fundamental Web Programming' },
    update: {},
    create: { name: 'Fundamental Web Programming' },
  });

  // 3. Create a Free Course
  const courseTitle = 'Pengantar Coding untuk Pemula';
  const existingCourse = await prisma.course.findFirst({
    where: { title: courseTitle },
  });

  let course;
  if (existingCourse) {
    console.log('Course already exists, clearing old chapters to re-seed...');
    await prisma.chapter.deleteMany({ where: { courseId: existingCourse.id } });
    
    course = await prisma.course.update({
      where: { id: existingCourse.id },
      data: {
         price: 0,
         description: 'Materi edukasi murni yang dirancang untuk mengenalkan Anda pada dunia pemrograman. Anda akan mempelajari logika dasar dan pengenalan sintaks tanpa ada pungutan biaya. Mari majukan pendidikan teknologi Indonesia!'
      }
    });
  } else {
    course = await prisma.course.create({
      data: {
        title: courseTitle,
        description: 'Materi edukasi murni yang dirancang untuk mengenalkan Anda pada dunia pemrograman. Anda akan mempelajari logika dasar dan pengenalan sintaks tanpa ada pungutan biaya. Mari majukan pendidikan teknologi Indonesia!',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop',
        price: 0,
        categoryId: category.id,
        isPublished: true,
      },
    });
  }

  // 4. Create Educational Chapters
  await prisma.chapter.create({
    data: {
      title: 'Bagian 1: Konsep Dasar Pemrograman',
      content: `Pernahkah Anda membayangkan bagaimana aplikasi di ponsel Anda bisa melakukan begitu banyak hal hebat? Mulai dari memesan makanan, mengirim pesan dalam hitungan detik, hingga memainkan game dengan grafis yang memukau. Semua itu tidak terjadi secara ajaib. Di balik layar, ada ribuan baris instruksi yang dengan patuh diikuti oleh komputer. Instruksi-instruksi inilah yang kita sebut sebagai **Kode**, dan proses menulis instruksi tersebut dikenal dengan nama **Pemrograman (Coding)**.

### Mengapa Komputer Membutuhkan Pemrograman?
Komputer pada dasarnya adalah mesin yang sangat cepat, namun sangat tidak mandiri. Berbeda dengan manusia yang bisa menebak maksud dari perkataan yang tidak jelas, komputer harus diberi instruksi yang sangat presisi, langkah demi langkah, tanpa ada satu pun keraguan.

Bayangkan Anda sedang mengajari alien yang baru pertama kali turun ke Bumi cara membuat secangkir kopi. Anda tidak bisa sekadar berkata, *"Tolong buatkan kopi."* Alien itu tidak tahu apa itu gelas, kopi, air panas, atau bahkan cara mengaduk. 
Anda harus menginstruksikannya seperti ini:
1. Ambil cangkir kosong di rak piring.
2. Ambil sendok kecil.
3. Masukkan 1 sendok bubuk kopi ke dalam cangkir.
4. Masukkan 1 sendok gula ke dalam cangkir.
5. Tuangkan air mendidih hingga cangkir hampir penuh.
6. Aduk perlahan dengan gerakan memutar sebanyak 10 kali.

Di dunia komputer, urutan langkah-langkah logis untuk menyelesaikan sebuah masalah ini disebut sebagai **Algoritma**. 

### Bahasa Pemrograman: Jembatan Kita ke Komputer
Sama seperti manusia memiliki berbagai bahasa (Bahasa Indonesia, Inggris, Jepang), komputer juga memiliki "bahasa" yang berbeda-beda untuk tujuan tertentu. Ada bahasa *Python* untuk analisis data dan kecerdasan buatan, bahasa *Java* untuk membuat aplikasi Android, dan bahasa *HTML/CSS/JavaScript* untuk membuat website.

Ketika Anda menulis kode, Anda pada dasarnya sedang menerjemahkan logika dan solusi (algoritma) yang ada di kepala Anda, ke dalam bahasa yang bisa dibaca dan dieksekusi oleh mesin. Dengan menguasai pemrograman, Anda tidak lagi sekadar menjadi *konsumen* teknologi, tetapi Anda bertransformasi menjadi seorang **Pencipta (Creator)**.

Di bab selanjutnya, kita akan langsung terjun mempraktikkan bagaimana cara "berbicara" kepada browser web menggunakan bahasa pertamanya: HTML.`,
      videoUrl: null, // Removed YT Video
      position: 1,
      isFree: true,
      courseId: course.id,
    },
  });

  await prisma.chapter.create({
    data: {
      title: 'Bagian 2: Mengenal Kerangka Web (HTML)',
      content: `Selamat! Anda telah memahami konsep dasar bahwa pemrograman adalah seni memberikan instruksi. Kini, saatnya kita belajar merakit instruksi nyata untuk membangun sesuatu yang bisa dilihat oleh seluruh dunia: **Sebuah Website**.

Untuk membangun sebuah rumah, Anda membutuhkan fondasi dan kerangka besi atau kayu. Di dunia web, kerangka tersebut bernama **HTML (Hypertext Markup Language)**. 

### Anatomi Bahasa HTML
HTML bukanlah bahasa yang digunakan untuk perhitungan matematis rumit. HTML adalah bahasa *Markup* (penandaan). Tugas utamanya sangat sederhana: **Memberitahu browser komputer mana bagian yang merupakan judul, paragraf, gambar, atau tautan.**

HTML menggunakan sistem "Tag" atau penanda yang diapit oleh tanda kurung siku ( \`< >\` ). Sebagian besar elemen HTML memiliki tag pembuka dan tag penutup.

Mari kita lihat struktur dasar sebuah dokumen HTML:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>Website Pertamaku</title>
</head>
<body>

  <h1>Selamat Datang di Website Saya!</h1>
  
  <p>Ini adalah paragraf pertama saya. Saya sedang belajar pemrograman dari nol.</p>
  
  <p>Ternyata coding itu seperti menulis surat untuk komputer.</p>

</body>
</html>
\`\`\`

### Membedah Kode di Atas
- \`<!DOCTYPE html>\` adalah semacam deklarasi yang berteriak kepada browser: *"Hei, dokumen ini ditulis dalam versi HTML modern!"*
- Segala sesuatu yang kita ingin tampilkan kepada pengguna harus diletakkan di dalam ruangan khusus, yaitu di antara \`<body>\` dan \`</body>\`.
- \`<h1>\` adalah singkatan dari *Heading 1*, yang berarti ini adalah teks Judul Utama yang sangat besar dan tebal.
- \`<p>\` adalah singkatan dari *Paragraph*, digunakan untuk menulis teks biasa yang panjang.

Cobalah perhatikan halaman web apa pun yang Anda kunjungi hari ini. Jika Anda menyingkirkan semua warna, desain, dan animasi yang mewah, pada intinya mereka semua dibangun menggunakan elemen teks \`<h1>\` dan \`<p>\` ini.

Dengan memahami struktur sederhana ini, Anda sudah meletakkan batu bata pertama dalam karir Anda sebagai seorang Web Developer.`,
      videoUrl: null, // Removed YT Video
      position: 2,
      isFree: true,
      courseId: course.id,
    },
  });

  // Quiz Chapter
  const quizPayload = {
    type: 'quiz',
    title: 'Kuis Evaluasi Pemahaman Dasar',
    description: 'Mari kita uji pemahaman Anda mengenai materi Konsep Dasar Pemrograman dan HTML yang baru saja Anda pelajari.',
    questions: [
      {
        id: 1,
        question: 'Apa definisi paling tepat mengenai pemrograman?',
        options: [
          'Proses memperbaiki komponen perangkat keras komputer.',
          'Proses memberikan instruksi logis kepada komputer untuk melakukan suatu tugas.',
          'Cara mendesain tampilan gambar secara visual.',
          'Menggunakan internet untuk mencari informasi.'
        ],
        correctAnswerIndex: 1
      },
      {
        id: 2,
        question: 'Sebuah urutan langkah demi langkah untuk menyelesaikan suatu masalah disebut dengan...',
        options: [
          'Algoritma',
          'Sintaks',
          'Browser',
          'HTML'
        ],
        correctAnswerIndex: 0
      },
      {
        id: 3,
        question: 'Tag HTML yang digunakan untuk membuat judul (heading) berukuran paling besar adalah?',
        options: [
          '<title>',
          '<p>',
          '<h1>',
          '<body>'
        ],
        correctAnswerIndex: 2
      }
    ]
  };

  await prisma.chapter.create({
    data: {
      title: 'Bagian 3: Kuis Evaluasi',
      content: JSON.stringify(quizPayload),
      videoUrl: null,
      position: 3,
      isFree: true,
      courseId: course.id,
    },
  });

  console.log(`✅ Educational Chapters & Quiz created successfully!`);
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
