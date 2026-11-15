import { prisma } from '../src/lib/prisma';

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await prisma.$connect();
  // Clear any existing test records
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});
