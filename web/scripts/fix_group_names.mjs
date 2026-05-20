import { PrismaClient } from './src/generated/prisma-next/index.js';

const prisma = new PrismaClient();

const levelLabels = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

async function main() {
  const groups = await prisma.classGroup.findMany();
  let updated = 0;
  
  for (const group of groups) {
    const expectedSuffix = `(${levelLabels[group.level] ?? group.level})`;
    if (!group.name.includes('(')) { // If it doesn't already have a generic suffix
      const newName = `${group.name} ${expectedSuffix}`;
      console.log(`Renaming: "${group.name}" -> "${newName}"`);
      await prisma.classGroup.update({
        where: { id: group.id },
        data: { name: newName }
      });
      updated++;
    }
  }
  
  console.log(`Updated ${updated} groups.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
