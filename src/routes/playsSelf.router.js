import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

/* 두 팀 간 매칭 API */
router.get("/match/team-vs-team", authMiddleware, async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { teamAId, teamBId } = req.query; // 사용자가 선택한 두 팀의 ID를 쿼리로 받음
  
      // 팀 ID가 전달되지 않으면 오류 처리
    if (!teamAId || !teamBId) {
      return res.status(400).json({ message: "두 팀의 ID를 모두 입력해주세요." });
    }

    // teamAId와 teamBId는 문자열로 전달되므로, 숫자로 변환
    const teamAIdNum = Number(teamAId);
    const teamBIdNum = Number(teamBId);

    // 숫자로 변환 후 NaN인지 확인
    if (isNaN(teamAIdNum) || isNaN(teamBIdNum)) {
      return res.status(400).json({ message: "올바른 팀 ID를 입력해주세요." });
    }

    // 팀 A 선수들 정보 가져오기
    const teamAPlayers = await prisma.teamInternals.findMany({
      where: { teamId: teamAIdNum }, // teamId를 숫자로 전달
      select: { playerId: true },
    });

    if (teamAPlayers.length !== 3) {
      return res.status(400).json({ message: "팀 A에 선수를 3명 배치해주세요." });
    }

    // 팀 B 선수들 정보 가져오기
    const teamBPlayers = await prisma.teamInternals.findMany({
      where: { teamId: teamBIdNum }, // teamId를 숫자로 전달
      select: { playerId: true },
    });

    if (teamBPlayers.length !== 3) {
      return res.status(400).json({ message: "팀 B에 선수를 3명 배치해주세요." });
    }
  
      // 팀 A와 팀 B의 고유 선수 ID 배열 만들기
      const uniqueTeamAPlayerIds = [...new Set(teamAPlayers.map(({ playerId }) => playerId))];
      const uniqueTeamBPlayerIds = [...new Set(teamBPlayers.map(({ playerId }) => playerId))];
  
      // 팀 A의 선수 정보 가져오기
      const teamAStats = await prisma.players.findMany({
        where: { playerId: { in: uniqueTeamAPlayerIds } },
        select: {
          speed: true,
          goalDecisiveness: true,
          shootPower: true,
          defense: true,
          stamina: true,
        },
      });
  
      // 팀 B의 선수 정보 가져오기
      const teamBStats = await prisma.players.findMany({
        where: { playerId: { in: uniqueTeamBPlayerIds } },
        select: {
          speed: true,
          goalDecisiveness: true,
          shootPower: true,
          defense: true,
          stamina: true,
        },
      });
  
      // 팀 A의 총 점수 구하기
      const teamATotalPower = teamAStats.reduce((total, player) => {
        const playerPower =
          player.speed +
          player.goalDecisiveness +
          player.shootPower +
          player.defense +
          player.stamina;
        return total + playerPower;
      }, 0);
  
      // 팀 B의 총 점수 구하기
      const teamBTotalPower = teamBStats.reduce((total, player) => {
        const playerPower =
          player.speed +
          player.goalDecisiveness +
          player.shootPower +
          player.defense +
          player.stamina;
        return total + playerPower;
      }, 0);
  
      // 최대 점수는 두 팀의 총 점수의 합
      const maxScore = teamATotalPower + teamBTotalPower;
  
      const randomValue = Math.random() * maxScore;
  
      let result;
  
      if (randomValue < teamATotalPower) {
        // 팀 A 승리
        const aScore = Math.floor(Math.random() * 4) + 2;
        const bScore = Math.floor(Math.random() * Math.min(3, aScore));
        result = `팀 ${teamAId}의 승리: ${aScore} - ${bScore}`;
      } else if (randomValue > teamATotalPower) {
        // 팀 B 승리
        const bScore = Math.floor(Math.random() * 4) + 2;
        const aScore = Math.floor(Math.random() * Math.min(3, bScore));
        result = `팀 ${teamBId}의 승리: ${bScore} - ${aScore}`;
      } else {
        // 무승부
        const drawScore = Math.floor(Math.random() * 4) + 2;
        result = `무승부: ${drawScore} - ${drawScore}`;
      }
  
      // 경기 결과 반환 (점수 변화는 없음)
      return res.status(201).json({ result });
    } catch (err) {
      next(err);
    }
  });

  export default router;