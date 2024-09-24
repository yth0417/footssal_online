-- AlterTable
ALTER TABLE `TeamInternals` ADD COLUMN `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `TeamInternals` ADD CONSTRAINT `TeamInternals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
