/*
  Warnings:

  - The `preferred_language` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "programming_language" AS ENUM ('cpp', 'java', 'python', 'javascript');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "preferred_language",
ADD COLUMN     "preferred_language" "programming_language";
