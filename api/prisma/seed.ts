import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ZimMaths database...');

  const topics = [
    { name: "General Arithmetic", slug: "general-arithmetic", orderIndex: 1, icon: "🔢", tier: 1, description: "Whole numbers, fractions, decimals, percentages, ratio, indices and standard form" },
    { name: "Number Bases", slug: "number-bases", orderIndex: 2, icon: "💻", tier: 3, description: "Place value in different bases, converting between bases, binary system" },
    { name: "Algebra", slug: "algebra", orderIndex: 3, icon: "📐", tier: 1, description: "Expressions, equations, factorisation, simultaneous equations, quadratics" },
    { name: "Sets", slug: "sets", orderIndex: 4, icon: "⭕", tier: 3, description: "Set notation, Venn diagrams, union, intersection and complement" },
    { name: "Geometry", slug: "geometry", orderIndex: 5, icon: "📏", tier: 2, description: "Angles, triangles, circles, constructions, locus and bearings" },
    { name: "Trigonometry", slug: "trigonometry", orderIndex: 6, icon: "📉", tier: 1, description: "Sine, cosine, tangent, sine rule, cosine rule and real-life applications" },
    { name: "Mensuration", slug: "mensuration", orderIndex: 7, icon: "📦", tier: 2, description: "Perimeter, area, volume and surface area of 2D and 3D shapes" },
    { name: "Graphs & Variation", slug: "graphs-variation", orderIndex: 8, icon: "📈", tier: 1, description: "Linear and quadratic graphs, distance-time, speed-time and variation" },
    { name: "Statistics", slug: "statistics", orderIndex: 9, icon: "📊", tier: 1, description: "Data collection, frequency tables, averages, range and statistical graphs" },
    { name: "Probability", slug: "probability", orderIndex: 10, icon: "🎲", tier: 1, description: "Experimental and theoretical probability, tree diagrams, combined events" },
    { name: "Matrices & Transformations", slug: "matrices-transformations", orderIndex: 11, icon: "🔄", tier: 2, description: "Matrix operations, determinants, inverses and transformation matrices" },
    { name: "Vectors", slug: "vectors", orderIndex: 12, icon: "➡️", tier: 2, description: "Vector notation, addition, subtraction, scalar multiplication and vector geometry" },
    { name: "Coordinate Geometry", slug: "coordinate-geometry", orderIndex: 13, icon: "📍", tier: 2, description: "Coordinates, midpoint, distance, gradient and equation of a straight line" },
    { name: "Financial Mathematics", slug: "financial-mathematics", orderIndex: 14, icon: "💰", tier: 3, description: "Simple and compound interest, profit, loss, hire purchase and budgets" },
    { name: "Measurement & Estimation", slug: "measurement-estimation", orderIndex: 15, icon: "📏", tier: 3, description: "Metric units, accuracy, error, tolerance and estimation" },
  ];

  for (const topic of topics) {
    await prisma.topic.upsert({
      where: { slug: topic.slug },
      update: {},
      create: topic,
    });
    console.log(`✅ Topic created: ${topic.name}`);
  }
// Seed sample papers
  console.log('📄 Seeding sample papers...');

  const topic_algebra = await prisma.topic.findUnique({ where: { slug: 'algebra' } });
  const topic_arithmetic = await prisma.topic.findUnique({ where: { slug: 'general-arithmetic' } });
  const topic_trig = await prisma.topic.findUnique({ where: { slug: 'trigonometry' } });
  const topic_stats = await prisma.topic.findUnique({ where: { slug: 'statistics' } });

  if (topic_algebra && topic_arithmetic && topic_trig && topic_stats) {

    const paper1 = await prisma.paper.upsert({
      where: { id: 'paper-nov-2022-p1' },
      update: {},
      create: {
        id: 'paper-nov-2022-p1',
        year: 2022,
        session: 'november',
        paperNumber: 1,
        title: 'ZIMSEC O-Level Mathematics November 2022 Paper 1',
        isFree: true,
        totalMarks: 80,
        questionCount: 30,
        difficultyOverall: 'medium',
      }
    });

    await prisma.question.createMany({
      data: [
        {
          paperId: paper1.id,
          questionNumber: 1,
          questionText: 'Evaluate 3² + 4² and write your answer in standard form.',
          marks: 2,
          difficulty: 'easy',
          topicId: topic_arithmetic.id,
          subtopic: 'Squares and standard form',
          solutionText: '3² = 9, 4² = 16. Sum = 25 = 2.5 × 10¹',
          isFree: true,
          isDailyEligible: true,
        },
        {
          paperId: paper1.id,
          questionNumber: 2,
          questionText: 'Factorise completely: 3x² - 12x',
          marks: 2,
          difficulty: 'easy',
          topicId: topic_algebra.id,
          subtopic: 'Factorisation',
          solutionText: '3x² - 12x = 3x(x - 4)',
          isFree: true,
          isDailyEligible: true,
        },
        {
          paperId: paper1.id,
          questionNumber: 3,
          questionText: 'Solve the simultaneous equations: 2x + y = 7 and x - y = 2',
          marks: 3,
          difficulty: 'medium',
          topicId: topic_algebra.id,
          subtopic: 'Simultaneous equations',
          solutionText: 'Add equations: 3x = 9, x = 3. Substitute: y = 1.',
          isFree: false,
          isDailyEligible: true,
        },
        {
          paperId: paper1.id,
          questionNumber: 4,
          questionText: 'The angle of elevation of the top of a building from a point 50m away is 32°. Calculate the height.',
          marks: 3,
          difficulty: 'medium',
          topicId: topic_trig.id,
          subtopic: 'Angles of elevation',
          solutionText: 'tan(32°) = height/50. Height = 50 × 0.6249 = 31.25m',
          isFree: false,
          isDailyEligible: true,
        },
        {
          paperId: paper1.id,
          questionNumber: 5,
          questionText: 'The mean of 5 numbers is 12. Four of the numbers are 8, 15, 10 and 14. Find the fifth number.',
          marks: 2,
          difficulty: 'easy',
          topicId: topic_stats.id,
          subtopic: 'Mean',
          solutionText: 'Total = 60. Sum of known = 47. Fifth = 60 - 47 = 13.',
          isFree: true,
          isDailyEligible: true,
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ Paper 1 (Nov 2022) seeded with 5 questions');

    await prisma.paper.upsert({
      where: { id: 'paper-jun-2022-p1' },
      update: {},
      create: {
        id: 'paper-jun-2022-p1',
        year: 2022,
        session: 'june',
        paperNumber: 1,
        title: 'ZIMSEC O-Level Mathematics June 2022 Paper 1',
        isFree: false,
        totalMarks: 80,
        questionCount: 28,
        difficultyOverall: 'hard',
      }
    });
    console.log('✅ Paper 2 (Jun 2022) seeded');

    await prisma.paper.upsert({
      where: { id: 'paper-nov-2021-p1' },
      update: {},
      create: {
        id: 'paper-nov-2021-p1',
        year: 2021,
        session: 'november',
        paperNumber: 1,
        title: 'ZIMSEC O-Level Mathematics November 2021 Paper 1',
        isFree: false,
        totalMarks: 80,
        questionCount: 30,
        difficultyOverall: 'medium',
      }
    });
    console.log('✅ Paper 3 (Nov 2021) seeded');

  }

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });