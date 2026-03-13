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