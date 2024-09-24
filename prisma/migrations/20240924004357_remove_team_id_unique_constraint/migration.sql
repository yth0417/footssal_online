-- CreateTable
CREATE TABLE `Users` (
    `userId` INTEGER NOT NULL AUTO_INCREMENT,
    `nickName` VARCHAR(191) NOT NULL,
    `id` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `win` INTEGER NOT NULL DEFAULT 0,
    `draw` INTEGER NOT NULL DEFAULT 0,
    `lose` INTEGER NOT NULL DEFAULT 0,
    `score` INTEGER NOT NULL DEFAULT 2000,
    `money` INTEGER NOT NULL DEFAULT 1000000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Users_nickName_key`(`nickName`),
    UNIQUE INDEX `Users_id_key`(`id`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Teams` (
    `teamId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Teams_name_key`(`name`),
    PRIMARY KEY (`teamId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamInternals` (
    `teamInternalsId` INTEGER NOT NULL AUTO_INCREMENT,
    `teamId` INTEGER NOT NULL,
    `playerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TeamInternals_teamId_playerId_key`(`teamId`, `playerId`),
    PRIMARY KEY (`teamInternalsId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlayerWaitingLists` (
    `playerWaitingListsId` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `teamId` INTEGER NULL,
    `playerId` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `count` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlayerWaitingLists_userId_playerId_key`(`userId`, `playerId`),
    PRIMARY KEY (`playerWaitingListsId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Players` (
    `playerId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `speed` INTEGER NOT NULL,
    `goalDecisiveness` INTEGER NOT NULL,
    `shootPower` INTEGER NOT NULL,
    `defense` INTEGER NOT NULL,
    `stamina` INTEGER NOT NULL,
    `tier` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Players_name_key`(`name`),
    PRIMARY KEY (`playerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Teams` ADD CONSTRAINT `Teams_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInternals` ADD CONSTRAINT `TeamInternals_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Teams`(`teamId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamInternals` ADD CONSTRAINT `TeamInternals_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Players`(`playerId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerWaitingLists` ADD CONSTRAINT `PlayerWaitingLists_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerWaitingLists` ADD CONSTRAINT `PlayerWaitingLists_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Teams`(`teamId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayerWaitingLists` ADD CONSTRAINT `PlayerWaitingLists_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Players`(`playerId`) ON DELETE CASCADE ON UPDATE CASCADE;
