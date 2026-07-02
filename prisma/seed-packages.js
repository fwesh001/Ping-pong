const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const packages = [
  { id: 'credit-50', name: '50 credits', credits: 50, price: 500 },
  { id: 'credit-110', name: '110 credits', credits: 110, price: 1000 },
  { id: 'credit-300', name: '300 credits', credits: 300, price: 2000 },
  { id: 'credit-1500', name: '1500 credits', credits: 1500, price: 5000 },
  { id: 'slot-1', name: '1 slot', credits: 0, price: 550 },
  { id: 'slot-3', name: '3 slots', credits: 0, price: 1500 },
  { id: 'slot-6', name: '6 slots', credits: 0, price: 2500 },
  { id: 'premium-1', name: 'Tier 1', credits: 500, price: 2500 },
  { id: 'premium-2', name: 'Tier 2', credits: 2000, price: 7500 },
  { id: 'premium-3', name: 'Tier 3', credits: 7000, price: 10500 },
];

async function main() {
  console.log('Seeding billing packages...');
  for (const pkg of packages) {
    await prisma.creditPackage.upsert({
      where: { id: pkg.id },
      update: {
        name: pkg.name,
        credits: pkg.credits,
        price: pkg.price,
      },
      create: pkg,
    });
  }
  console.log('Billing packages seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
