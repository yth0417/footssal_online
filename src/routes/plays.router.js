import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 매칭 API */
router.get("/match", authMiddleware, async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { teamId } = req.query; // 사용자가 선택한 팀 ID를 쿼리로 받음

    // 내 계정 찾기
    const myAccount = await prisma.users.findFirst({
      where: { userId: userId.userId },
    });

    if (!myAccount) {
      return res.status(404).json({ message: "내 계정을 찾을 수 없습니다." });
    }

    // 내 팀 선수들 정보 가져오기
    const myTeam = await prisma.teamInternals.findMany({
      where: { teamId: Number(teamId) },
      select: { playerId: true },
    });

    if (myTeam.length !== 3) {
      return res.status(400).json({ message: "팀에 선수를 3명 배치해주세요." });
    }

    // 매치메이킹 API
    // 매치 가능하고 3명을 배치한 유저들 정보 가져오기
    const allTeams = await prisma.teamInternals.findMany({
      select: {
        userId: true,
        playerId: true,
      },
    });

    // userId별로 선수가 3명인 유저만 필터링
    const userTeamCount = allTeams.reduce(function (teamCount, team) {
      teamCount[team.userId] = (teamCount[team.userId] || 0) + 1;
      return teamCount;
    }, {});

    // 3명의 선수를 가진 유저만 필터링하여 배열로 저장
    const matchUsersArr = Object.keys(userTeamCount).filter(
      (userId) => userTeamCount[userId] === 3
    );

    if (matchUsersArr.length === 1) {
      return res
        .status(400)
        .json({ message: "상대방이 없어서 매칭이 불가합니다." });
    }
    const scoreArr = await prisma.users.findMany({
      where: {
        userId: {
          in: matchUsersArr,
        },
      },
      select: {
        score: true,
        userId: true,
      },
      orderBy: {
        score: "asc",
      },
    });

    const enemyIdArr = [];

    // 내 점수를 기준으로 위 아래 3명 가져오기
    for (let i = 0; i < scoreArr.length; i++) {
      if (scoreArr[i].userId === userId) {
        // 내 점수를 기준으로 아래 3명 가져오기
        for (let j = i - 1; j >= 0 && j >= i - 3; j--) {
          enemyIdArr.push(scoreArr[j].userId);
        }
        // 내 점수를 기준으로 위 3명 가져오기
        for (let j = i + 1; j < scoreArr.length && j <= i + 3; j++) {
          enemyIdArr.push(scoreArr[j].userId);
        }
      }
    }

    if (enemyIdArr.length === 0) {
      return res
        .status(400)
        .json({ message: "적합한 상대를 찾을 수 없습니다." });
    }

    const enemysId = enemyIdArr[Math.floor(Math.random() * enemyIdArr.length)];

    // 상대 팀 선수들 정보 가져오기
    const enemyTeam = await prisma.teamInternals.findMany({
      where: {
        userId: enemysId.userId,
      },
      select: {
        playerId: true,
      },
    });

    // 내 팀의 선수 정보 가져오기
    const myTeamPlayerIds = myTeam.map(({ playerId }) => playerId);
    const myTeamPlayers = await prisma.players.findMany({
      where: { playerId: { in: myTeamPlayerIds } },
      select: {
        speed: true,
        goalDecisiveness: true,
        shootPower: true,
        defense: true,
        stamina: true,
      },
    });

    // 상대 팀의 선수 정보 가져오기
    const enemyTeamPlayerIds = enemyTeam.map(({ playerId }) => playerId);
    const enemyPlayers = await prisma.players.findMany({
      where: { playerId: { in: enemyTeamPlayerIds } },
      select: {
        speed: true,
        goalDecisiveness: true,
        shootPower: true,
        defense: true,
        stamina: true,
      },
    });

    // 내 팀의 총 점수 구하기
    const myTeamTotalPower = myTeamPlayers.reduce((total, player) => {
      const playerPower =
        player.speed +
        player.goalDecisiveness +
        player.shootPower +
        player.defense +
        player.stamina;
      return total + playerPower;
    }, 0);

    // 상대 팀의 총 점수 구하기
    const enemyTeamTotalPower = enemyPlayers.reduce((total, player) => {
      const enemyPlayerPower =
        player.speed +
        player.goalDecisiveness +
        player.shootPower +
        player.defense +
        player.stamina;
      return total + enemyPlayerPower;
    }, 0);

    // 최대 점수는 두 팀의 총 점수의 합
    const maxScore = myTeamTotalPower + enemyTeamTotalPower;

    const randomValue = Math.random() * maxScore;

    let result;
    let newMyScore;
    let newEnemyScore;

    // 내 게임 점수
    const myScore = await prisma.users.findFirst({
      where: { userId: userId.userId },
      select: { score: true },
    });

    // 상대방 게임 점수
    const enemyScore = await prisma.users.findFirst({
      where: { userId: enemysId.userId },
      select: { score: true },
    });

    if (randomValue < myTeamTotalPower) {
      // 내 팀 승리
      const aScore = Math.floor(Math.random() * 4) + 2;
      const bScore = Math.floor(Math.random() * Math.min(3, aScore));
      result = `내 팀의 승리: A ${aScore} - ${bScore} B`;

      newMyScore = myScore.score + 10;
      newEnemyScore = Math.max(enemyScore.score - 5, 0);
    } else if (randomValue > myTeamTotalPower) {
      // 상대 팀 승리
      const bScore = Math.floor(Math.random() * 4) + 2;
      const aScore = Math.floor(Math.random() * Math.min(3, bScore));
      result = `적 팀의 승리: B ${bScore} - ${aScore} A`;

      newMyScore = Math.max(myScore.score - 5, 0);
      newEnemyScore = enemyScore.score + 10;
    } else {
      // 무승부
      const drawScore = Math.floor(Math.random() * 4) + 2;
      result = `무승부: A ${drawScore} - ${drawScore} B`;

      newMyScore = myScore.score + 3;
      newEnemyScore = enemyScore.score + 3;
    }

    // 점수 업데이트
    await prisma.users.update({
      where: { userId: userId.userId },
      data: { score: newMyScore },
    });

    await prisma.users.update({
      where: { userId: enemysId.userId },
      data: { score: newEnemyScore },
    });

    // 결과 반환
    return res
      .status(201)
      .json({ result, myScore: newMyScore, enemyScore: newEnemyScore });
  } catch (err) {
    next(err);
  }
});

export default router;
