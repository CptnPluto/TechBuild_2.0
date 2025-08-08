import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample projects
  const project1 = await prisma.project.upsert({
    where: { id: 'sample-project-1' },
    update: {},
    create: {
      id: 'sample-project-1',
      name: 'Downtown Office Building',
      description: 'Modern 15-story office building in downtown district with mixed-use commercial space',
      client: 'Urban Development Corp',
      location: 'Downtown District, Main City',
      status: 'ACTIVE'
    }
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'sample-project-2' },
    update: {},
    create: {
      id: 'sample-project-2',
      name: 'Residential Complex Phase 2',
      description: 'Multi-family residential complex with 200 units and amenities',
      client: 'Housing Solutions LLC',
      location: 'Suburban Area, West Side',
      status: 'ACTIVE'
    }
  });

  const project3 = await prisma.project.upsert({
    where: { id: 'sample-project-3' },
    update: {},
    create: {
      id: 'sample-project-3',
      name: 'Renovation Project - Historic Building',
      description: 'Historic preservation and modernization of 1920s commercial building',
      client: 'Heritage Properties',
      location: 'Historic District',
      status: 'COMPLETED'
    }
  });

  // Create sample activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        level: 'INFO',
        message: 'Project created successfully',
        projectId: project1.id,
        metadata: {
          action: 'project_created',
          user: 'system'
        }
      },
      {
        level: 'INFO',
        message: 'Project created successfully',
        projectId: project2.id,
        metadata: {
          action: 'project_created',
          user: 'system'
        }
      },
      {
        level: 'INFO',
        message: 'Project completed',
        projectId: project3.id,
        metadata: {
          action: 'project_status_changed',
          user: 'system',
          from: 'ACTIVE',
          to: 'COMPLETED'
        }
      }
    ]
  });

  console.log('✅ Database seed completed successfully!');
  console.log(`📊 Created projects:`);
  console.log(`  - ${project1.name} (${project1.id})`);
  console.log(`  - ${project2.name} (${project2.id})`);
  console.log(`  - ${project3.name} (${project3.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });