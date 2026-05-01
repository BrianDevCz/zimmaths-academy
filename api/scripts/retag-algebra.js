const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function retagAlgebra() {
  const questions = await p.question.findMany({
    where: { topic: { slug: 'algebra' } },
    select: { id: true, questionText: true }
  });

  let bOnly = 0, both = 0;

  for (const q of questions) {
    const t = q.questionText.toLowerCase();
    const isBOnly =
      t.includes('velocity') ||
      t.includes('time graph') ||
      t.includes('speed-time') ||
      t.includes('linear programming') ||
      (t.includes('inequalit') && t.includes('shade')) ||
      /[6-9]x\^2|1[0-9]x\^2/.test(t) ||
      t.includes('α') ||
      t.includes('β') ||
      t.includes('roots') ||
      (t.includes('simplify') && t.includes('fraction'));

    if (isBOnly) {
      bOnly++;
    } else {
      await p.question.update({ where: { id: q.id }, data: { syllabus: 'BOTH' } });
      both++;
    }
  }

  console.log('Algebra questions:');
  console.log('  Tagged BOTH (A-suitable):', both);
  console.log('  Kept as B (B-only):', bOnly);
  await p.$disconnect();
}

retagAlgebra().catch(e => { console.error(e); p.$disconnect(); process.exit(1); });