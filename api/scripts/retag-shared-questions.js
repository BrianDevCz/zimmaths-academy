// api/scripts/retag-shared-questions.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sharedSlugs = [
  'general-arithmetic',
  'number-bases',
  'sets',
  'geometry',
  'mensuration',
  'statistics',
  'probability',
  'financial-mathematics',
  'measurement-estimation'
];

async function retag() {
  console.log('Retagging shared topic questions as BOTH...\n');

  for (const slug of sharedSlugs) {
    const topic = await prisma.topic.findUnique({ where: { slug } });
    if (!topic) {
      console.log(`  ${slug} — topic not found, skipping`);
      continue;
    }

    const result = await prisma.question.updateMany({
      where: { topicId: topic.id },
      data: { syllabus: 'BOTH' }
    });

    console.log(`  ${slug}: ${result.count} questions → BOTH`);
  }

  console.log('\n✅ Retag complete!');
  await prisma.$disconnect();
}

retag().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });