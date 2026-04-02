-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "difficulty" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lifetimePoints" INTEGER NOT NULL DEFAULT 0;
