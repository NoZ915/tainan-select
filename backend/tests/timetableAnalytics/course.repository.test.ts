import assert from "node:assert/strict";
import test from "node:test";
import { Op, Transaction } from "sequelize";
import CourseModel from "../../models/Course";
import CourseRepository from "../../repositories/courseRepository";

test("findSemestersByIds 只查詢課程驗證需要的欄位", async (t) => {
  const transaction = {} as Transaction;
  const findAllMock = t.mock.method(CourseModel, "findAll", async () => []);

  await CourseRepository.findSemestersByIds([1, 2], transaction);

  const options = findAllMock.mock.calls[0].arguments[0];
  assert.deepEqual(options?.attributes, ["id", "semester"]);
  assert.deepEqual((options?.where as { id: { [Op.in]: number[] } }).id[Op.in], [1, 2]);
  assert.equal(options?.transaction, transaction);
  assert.equal(options?.raw, true);
});
