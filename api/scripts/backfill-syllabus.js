// api/scripts/backfill-syllabus.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOPIC_SYLLABUS_MAP = {
  // Shared topics (appear in both A and B)
  'general-arithmetic': 'BOTH',
  'number-bases': 'BOTH',       // basic number bases are in Syllabus A
  'algebra': 'BOTH',            // basic algebra is shared
  'sets': 'BOTH',
  'geometry': 'BOTH',           // basic geometry shared; B has circle theorems, loci
  'mensuration': 'BOTH',
  'statistics': 'BOTH',
  'probability': 'BOTH',
  'financial-mathematics': 'BOTH',
  'measurement-estimation': 'BOTH',
  // B-only topics
  'trigonometry': 'B',
  'graphs-variation': 'B',      // variation and advanced graphs
  'matrices-transformations': 'B', // matrices shared but transformations B-only, so treat whole topic as B
  'vectors': 'B',
  'coordinate-geometry': 'B'
};

async function backfill() {
  console.log('Starting syllabus backfill...\n');

  // 1. Update topics
  console.log('Updating topics...');
  for (const [slug, syllabus] of Object.entries(TOPIC_SYLLABUS_MAP)) {
    const topic = await prisma.topic.findUnique({ where: { slug } });
    if (topic) {
      await prisma.topic.update({
        where: { slug },
        data: { syllabus }
      });
      console.log(`  ${slug} → ${syllabus}`);
    } else {
      console.log(`  ${slug} — NOT FOUND, skipping`);
    }
  }

  // 2. Update questions, papers, and lessons to inherit their topic's syllabus
  console.log('\nUpdating questions...');
  for (const [slug, syllabus] of Object.entries(TOPIC_SYLLABUS_MAP)) {
    const topic = await prisma.topic.findUnique({ where: { slug } });
    if (!topic) continue;
    const result = await prisma.question.updateMany({
      where: { topicId: topic.id },
      data: { syllabus }
    });
    console.log(`  ${slug}: ${result.count} questions updated → ${syllabus}`);
  }

  console.log('\nUpdating papers...');
  // Papers are tagged B by default (all existing papers are for Syllabus B)
  const papersResult = await prisma.paper.updateMany({
    data: { syllabus: 'B' }
  });
  console.log(`  ${papersResult.count} papers updated → B`);

  console.log('\nUpdating lessons...');
  for (const [slug, syllabus] of Object.entries(TOPIC_SYLLABUS_MAP)) {
    const topic = await prisma.topic.findUnique({ where: { slug } });
    if (!topic) continue;
    const result = await prisma.lesson.updateMany({
      where: { topicId: topic.id },
      data: { syllabus }
    });
    console.log(`  ${slug}: ${result.count} lessons updated → ${syllabus}`);
  }

  // 3. Update existing users to default to B
  console.log('\nUpdating users...');
  const usersResult = await prisma.user.updateMany({
    where: { syllabusChoice: { equals: [] } },
    data: {
      syllabusChoice: ['B'],
      activeSyllabus: 'B'
    }
  });
  console.log(`  ${usersResult.count} users defaulted to B`);

  console.log('\n✅ Backfill complete!');
  await prisma.$disconnect();
}

backfill().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});