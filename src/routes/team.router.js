import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 선수는 무조건 3명, 이하일 수 없음
// 추가 제거 api를 변경 api로 통합

// ** 팀 생성 api **
router.post("/teams", authMiddleware, async (req, res) => {
  try {
    const { playerIds, name } = req.body;
    const userId = req.user;

    // 필드 유효성 검사
    if (!playerIds || playerIds.length !== 3) {
      return res.status(400).json({ error: "3명의 플레이어 ID가 필요합니다." });
    }

    // 사용자 존재 여부 확인
    const userExists = await prisma.users.findUnique({
      where: { userId: userId.userId },
    });

    if (!userExists) {
      return res.status(404).json({ error: "사용자가 존재하지 않습니다." });
    }

    // 대기 명단에 있는 선수만 팀에 추가할 수 있도록 검증
    const playersInWaitingList = await prisma.playerWaitingLists.findMany({
      where: {
        userId: userId.userId, // 현재 사용자의 대기 명단에서
        playerId: { in: playerIds }, // 요청된 playerIds가 포함되는지 확인
      },
      select: { playerId: true },
    });

    // 대기 명단에 없는 선수가 있는지 확인
    const checkPlayerIds = playersInWaitingList.map((p) => p.playerId);
    const passPlayerIds = playerIds.filter(
      (id) => !checkPlayerIds.includes(id)
    );

    if (passPlayerIds.length > 0) {
      return res.status(400).json({
        error: `대기 명단에 없는 플레이어가 포함되어 있습니다`,
      });
    }

    // 새로운 팀 생성
    const newTeam = await prisma.teams.create({
      data: {
        userId: userId.userId,
        name: name || null,
        TeamInternal: {
          create: playerIds.map((playerId) => ({ playerId })),
        },
      },
    });

    res
      .status(201)
      .json({
        message: "팀이 성공적으로 생성되었습니다.",
        teamId: newTeam.teamId,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류" });
  }
});
// ** 팀 조회 api **
router.get("/teams", authMiddleware, async (req, res) => {
  try {
    const teams = await prisma.teams.findMany({
      select: {
        userId: true,
        teamId: true,
        name: true,
        TeamInternal: {
          select: {
            playerId: true,
          },
        },
      },
    });

    // 선수 정보를 추가
    const teamWithPlayers = await Promise.all(
      teams.map(async (team) => {
        const players = await prisma.players.findMany({
          where: {
            playerId: {
              in: team.TeamInternal.map((internal) => internal.playerId),
            },
          },
          select: {
            playerId: true,
            name: true,
          },
        });

        return {
          teamId: team.teamId,
          userId: team.userId,
          name: team.name,
          players,
        };
      })
    );

    res.json(teamWithPlayers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ** 팀 선수 변경 api **
router.put("/teams/:teamId", authMiddleware, async (req, res) => {
  const { teamId } = req.params;
  const { playerId, newPlayerId } = req.body;
  const userId = req.user;

  try {
    // 먼저 팀과 현재 선수 확인
    const existingTeam = await prisma.teams.findUnique({
      where: { teamId: parseInt(teamId, 10) },
      include: { TeamInternal: true },
    });

    if (!existingTeam) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    // 현재 선수 목록에서 교체할 선수 존재 여부 확인
    const existingPlayer = existingTeam.TeamInternal.find(
      (internal) => internal.playerId === playerId
    );

    if (!existingPlayer) {
      return res
        .status(404)
        .json({ error: "팀에 해당 선수가 존재하지 않습니다." });
    }

    // 3. 교체할 새로운 선수가 대기 명단에 있는지 확인
    const playerInWaitingList = await prisma.playerWaitingLists.findFirst({
      where: {
        userId: userId.userId,
        playerId: newPlayerId,
      },
    });

    if (!playerInWaitingList) {
      return res
        .status(400)
        .json({ error: "대기 명단에 없는 플레이어입니다." });
    }

    // 선수 삭제
    await prisma.teamInternals.delete({
      where: {
        teamId_playerId: {
          // 복합 키를 사용해 정확한 선수만 삭제
          teamId: parseInt(teamId, 10),
          playerId: playerId,
        },
      },
    });

    // 선수 추가 (새로운 playerId로 교체)
    await prisma.teamInternals.create({
      data: {
        teamId: parseInt(teamId, 10),
        playerId: newPlayerId,
      },
    });

    // 교체 후 팀에 여전히 3명의 선수가 있는지 확인
    const updatedTeam = await prisma.teamInternals.findMany({
      where: { teamId: parseInt(teamId, 10) },
    });

    if (updatedTeam.length !== 3) {
      return res
        .status(400)
        .json({ error: "팀에는 반드시 3명의 선수가 있어야 합니다." });
    }

    res.status(200).json({ message: "선수가 성공적으로 교체되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "선수 교체에 실패했습니다." });
  }
});

// ** 팀 삭제 API **
router.delete("/teams/:teamId", authMiddleware, async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user; // 인증된 사용자의 userId 가져오기

  try {
    // 1. 팀 존재 여부 확인
    const existingTeam = await prisma.teams.findUnique({
      where: { teamId: parseInt(teamId, 10) },
    });

    if (!existingTeam) {
      return res.status(404).json({ error: "팀을 찾을 수 없습니다." });
    }

    // 2. 요청한 사용자가 팀 소유자인지 확인
    if (existingTeam.userId !== userId.userId) {
      return res.status(403).json({ error: "이 팀을 삭제할 권한이 없습니다." });
    }

    // 3. 팀 삭제
    await prisma.teams.delete({
      where: { teamId: parseInt(teamId, 10) },
    });

    // 4. 응답 반환
    res.status(200).json({ message: "팀이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "팀 삭제에 실패했습니다." });
  }
});

export default router;
