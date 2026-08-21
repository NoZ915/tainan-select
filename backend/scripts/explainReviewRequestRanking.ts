import { randomUUID } from "node:crypto";
import { QueryTypes, Transaction } from "sequelize";
import db from "../models";
import CourseRepository from "../repositories/courseRepository";

type ExplainNode = Record<string, unknown>;

const collectExplainTables = (value: unknown, rows: string[] = []): string[] => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectExplainTables(item, rows));
    return rows;
  }
  if (!value || typeof value !== "object") return rows;

  const node = value as ExplainNode;
  if (typeof node.table_name === "string") {
    rows.push([
      node.table_name,
      `access=${String(node.access_type ?? "unknown")}`,
      `key=${String(node.key ?? "none")}`,
      `rows=${String(node.rows_examined_per_scan ?? "unknown")}`,
    ].join(" | "));
  }
  Object.values(node).forEach((item) => collectExplainTables(item, rows));
  return rows;
};

const run = async (): Promise<void> => {
  await db.sequelize.authenticate();

  const semesters = await db.sequelize.query<{ semester: string }>(
    `SELECT semester
     FROM Courses
     WHERE semester REGEXP '^[0-9]{3}-[12]$'
     GROUP BY semester
     ORDER BY semester DESC
     LIMIT 1`,
    { type: QueryTypes.SELECT }
  );
  const semester = semesters[0]?.semester;
  if (!semester) throw new Error("找不到可用學期資料");

  await db.sequelize.transaction(async (transaction: Transaction) => {
    await db.sequelize.query(
      `CREATE TEMPORARY TABLE GuestTimetableSnapshots (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        client_id CHAR(36) NOT NULL,
        semester VARCHAR(10) NOT NULL,
        course_ids JSON NOT NULL,
        last_synced_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uniq_guest_timetable_snapshots_client_semester (client_id, semester),
        KEY idx_guest_timetable_snapshots_semester_synced_at (semester, last_synced_at)
      )`,
      { transaction }
    );

    const courses = await db.sequelize.query<{ id: number }>(
      `SELECT id
       FROM Courses
       WHERE semester = :semester
       ORDER BY id DESC
       LIMIT 10`,
      { replacements: { semester }, type: QueryTypes.SELECT, transaction }
    );
    if (courses.length === 0) throw new Error(`${semester} 沒有可用課程`);

    const snapshots = Array.from({ length: 30 }, (_, index) => ({
      clientId: randomUUID(),
      courseIds: courses
        .filter((_, courseIndex) => courseIndex % 3 === index % 3)
        .slice(0, 3)
        .map((course) => course.id),
    }));
    for (const snapshot of snapshots) {
      await db.sequelize.query(
        `INSERT INTO GuestTimetableSnapshots
          (client_id, semester, course_ids, last_synced_at, created_at, updated_at)
         VALUES (:clientId, :semester, :courseIds, NOW(), NOW(), NOW())`,
        {
          replacements: {
            clientId: snapshot.clientId,
            semester,
            courseIds: JSON.stringify(snapshot.courseIds),
          },
          transaction,
        }
      );
    }
    await db.sequelize.query(
      `INSERT INTO GuestTimetableSnapshots
        (client_id, semester, course_ids, last_synced_at, created_at, updated_at)
       VALUES (
         :clientId,
         :semester,
         :courseIds,
         DATE_SUB(NOW(), INTERVAL 181 DAY),
         NOW(),
         NOW()
       )`,
      {
        replacements: {
          clientId: randomUUID(),
          semester,
          courseIds: JSON.stringify([courses[0].id]),
        },
        transaction,
      }
    );

    let rankingSql = "";
    const sequelizeOptions = (db.sequelize as unknown as {
      options: { logging: false | ((sql: string) => void) };
    }).options;
    const previousLogging = sequelizeOptions.logging;
    sequelizeOptions.logging = (sql: string) => {
      if (sql.includes("SELECT") && sql.includes("reviewRequestScore")) {
        rankingSql = sql.replace(/^Executing \([^)]+\):\s*/, "");
      }
    };

    let ranking;
    try {
      ranking = await CourseRepository.getReviewRequestCourses(
        semester,
        20,
        transaction
      );
    } finally {
      sequelizeOptions.logging = previousLogging;
    }
    if (!rankingSql) throw new Error("無法取得排行 SQL");

    const authenticatedCounts = await db.sequelize.query<{ count: number | string }>(
      `SELECT COUNT(DISTINCT timetable_items.timetable_id) AS count
       FROM TimetableItems AS timetable_items
       INNER JOIN Timetables AS timetables
         ON timetables.id = timetable_items.timetable_id
       WHERE timetable_items.course_id = :courseId
         AND timetables.semester = :semester`,
      {
        replacements: { courseId: courses[0].id, semester },
        type: QueryTypes.SELECT,
        transaction,
        logging: false,
      }
    );
    const firstCourseRanking = ranking.find((item) => Number(item.id) === Number(courses[0].id));
    const expectedTimetableCount = Number(authenticatedCounts[0]?.count ?? 0) + 10;
    if (Number(firstCourseRanking?.timetableCount) !== expectedTimetableCount) {
      throw new Error("過期 Guest Snapshot TTL 驗證失敗");
    }

    const explainRows = await db.sequelize.query<Record<string, string>>(
      `EXPLAIN FORMAT=JSON ${rankingSql}`,
      { type: QueryTypes.SELECT, transaction, logging: false }
    );
    const explainJson = JSON.parse(explainRows[0]?.EXPLAIN ?? "{}");

    console.log(`驗證學期：${semester}`);
    console.log(`候選結果：${ranking.length} 筆`);
    console.table(ranking.slice(0, 20).map((item) => ({
      id: item.id,
      課名: item.course_name,
      評價數: item.review_count,
      近期收藏分數: Number(item.weightedFavoriteScore),
      課表數: Number(item.timetableCount),
      求評價分數: Number(item.reviewRequestScore),
    })));
    console.log("EXPLAIN 存取摘要：");
    collectExplainTables(explainJson).forEach((row) => console.log(row));
  });
};

run()
  .catch((error) => {
    console.error("求評價排行驗證失敗：", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.sequelize.close();
  });
