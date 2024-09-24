import express from "express";
import { prisma } from "../utils/prisma/index.js";  
import authMiddleware from "../middlewares/auth.middleware.js";  


const router = express.Router();

// 스키마 유저에 추가한 새로운 필드 4가지 -> 도전과제를 위한. 
// challenge10Wins      Boolean     @default(false)  @map("challenge10Wins")  // 10승 챌린지
// challenge30Wins      Boolean     @default(false)  @map("challenge30Wins")  // 30승 챌린지
// challenge50Wins      Boolean     @default(false)  @map("challenge50Wins")  // 50승 챌린지
// challenge100Wins     Boolean     @default(false)  @map("challenge100Wins") // 100승 챌린지
// 기본 세팅으로 거짓으로 유지 이후 조건 만족시 true 로 변경.
// 자바스크립트 특성인 동적 타이핑을 이용



//import challengesRouter from "./routes/challenges.router.js";  // 연동을 위해  app.js에 새롭게 추가.



router.patch("/checkChallenges", authMiddleware, async (req, res, next) => {
  try {
    
    const user = req.user;

    // 10승 챌린지 확인 유저

    //사용자가 10승 이상 승리 했고 10승 보상을 아직 안받았는지 true or false 로 확인 false 여야 조건 달성
    //사용자가 10승 이상이면서 아직 보상을 받지 않은 상태여야 함.
    // 조건 완성시 money 에 +정수방식으로 돈 추가 지급 

    if (user.win >= 10 && !user.challenge10Wins) {
      await prisma.users.update({
        where: { userId: user.userId },
        data: { 
          challenge10Wins: true,  // 10승 달성
          money: user.money + 10000  // 보상 
        }
      });
      console.log(`Player ${user.nickName} 님이 10승 도전과제에 성공하여 10,000원을 받습니다!`);
    }

    // 30승 
    if (user.win >= 30 && !user.challenge30Wins) {
      await prisma.users.update({
        where: { userId: user.userId },
        data: { 
          challenge30Wins: true,  
          money: user.money + 30000  // 30승 보상 
        }
      });
      console.log(`Player ${user.nickName} 님이 30승 도전과제에 성공하여 30,000원을 받습니다!`);
    }

    // 50승 
    if (user.win >= 50 && !user.challenge50Wins) {
      await prisma.users.update({
        where: { userId: user.userId },
        data: { 
          challenge50Wins: true,  
          money: user.money + 50000  // 50승 보상 
        }
      });
      console.log(`Player ${user.nickName} 님이 50승 도전과제에 성공하여 50,000원을 받습니다!`);
    }

    // 100승 
    if (user.win >= 100 && !user.challenge100Wins) {
      await prisma.users.update({
        where: { userId: user.userId },
        data: { 
          challenge100Wins: true,  
          money: user.money + 100000  // 100승 보상
        }
      });
      console.log(`Player ${user.nickName} 님이 100승 도전과제에 성공하여 100,000원을 받습니다!`);
    }

    // 성공 메시지 
    return res.status(200).json({
      message: "챌린지 확인 및 보상 지급이 완료되었습니다."
    });

  } catch (error) {
    // 에러 
    next(error);
  }
});

export default router;
