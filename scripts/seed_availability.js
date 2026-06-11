/* eslint-disable */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const scheduleId = "mamE-2Jh9Ng2erhfTrEMgUT3";

  // 스케줄 더미 정보 확보 (없으면 생성)
  await prisma.schedule.upsert({
    where: { id: scheduleId },
    update: {
      hostTokenHash: "PMcSBcCq_9Ue4PqCJYvbPFrEC9X5RMx4oeAs0hTIoUQ",
      title: "디자인 개선 정기 회의",
      durationMinutes: 60,
      candidateDays: JSON.stringify(["MON", "TUE", "WED"]),
      candidateStartHour: 10,
      candidateEndHour: 18,
      status: "open",
    },
    create: {
      id: scheduleId,
      hostTokenHash: "PMcSBcCq_9Ue4PqCJYvbPFrEC9X5RMx4oeAs0hTIoUQ",
      title: "디자인 개선 정기 회의",
      durationMinutes: 60,
      candidateDays: JSON.stringify(["MON", "TUE", "WED"]),
      candidateStartHour: 10,
      candidateEndHour: 18,
      status: "open",
    },
  });

  // 기존 해당 스케줄 참여자 데이터 클리어 (중복 방지)
  await prisma.scheduleParticipant.deleteMany({
    where: { scheduleId },
  });

  const dummyData = [
    {
      id: "dummy-p1",
      scheduleId,
      name: "김영희",
      available: JSON.stringify([
        { day: "MON", startHour: 10, endHour: 11 },
        { day: "TUE", startHour: 14, endHour: 15 },
        { day: "TUE", startHour: 15, endHour: 16 },
      ]),
    },
    {
      id: "dummy-p2",
      scheduleId,
      name: "이철수",
      available: JSON.stringify([
        { day: "TUE", startHour: 14, endHour: 15 },
        { day: "TUE", startHour: 15, endHour: 16 },
        { day: "WED", startHour: 11, endHour: 12 },
        { day: "WED", startHour: 12, endHour: 13 },
      ]),
    },
    {
      id: "dummy-p3",
      scheduleId,
      name: "박민수",
      available: JSON.stringify([
        { day: "MON", startHour: 10, endHour: 11 },
        { day: "TUE", startHour: 14, endHour: 15 },
        { day: "TUE", startHour: 15, endHour: 16 },
        { day: "WED", startHour: 11, endHour: 12 },
        { day: "WED", startHour: 12, endHour: 13 },
      ]),
    },
    {
      id: "dummy-p4",
      scheduleId,
      name: "최지수",
      available: JSON.stringify([
        { day: "TUE", startHour: 14, endHour: 15 },
        { day: "TUE", startHour: 15, endHour: 16 },
      ]),
    },
  ];

  for (const participant of dummyData) {
    await prisma.scheduleParticipant.create({
      data: participant,
    });
  }

  console.log(
    "Successfully seeded dummy availability data to SQLite database!",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
