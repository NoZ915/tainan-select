import { RequestHandler, Response } from "express";
import TimetableService, { TimetableServiceError } from "../services/timetableService";

const parsePositiveSafeInteger = (value: unknown): number | null => {
  if (
    (typeof value !== "string" && typeof value !== "number")
    || String(value).trim() === ""
  ) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
};

const handleTimetableError = (res: Response, err: unknown): void => {
  if (err instanceof TimetableServiceError) {
    res.status(err.status).json({
      message: err.message,
      ...(err.payload ? { ...((err.payload as Record<string, unknown>)) } : {}),
    });
    return;
  }
  res.status(500).json({ message: err });
};

export const getOrCreateTimetable: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ message: "未授權的使用者" });
      return;
    }

    const semester = String(req.query.semester || "").trim();
    const result = await TimetableService.getOrCreateTimetable(user_id, semester);
    res.status(200).json(result);
  } catch (err) {
    handleTimetableError(res, err);
  }
};

export const getAllAddedCourses: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ message: "未授權的使用者" });
      return;
    }

    const result = await TimetableService.getAllAddedCourses(user_id);
    res.status(200).json({ items: result });
  } catch (err) {
    handleTimetableError(res, err);
  }
};

export const addTimetableCourse: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ message: "未授權的使用者" });
      return;
    }

    const timetableId = parsePositiveSafeInteger(req.params.timetableId);
    const courseId = parsePositiveSafeInteger(req.body?.courseId);
    if (timetableId === null || courseId === null) {
      res.status(400).json({ message: "參數格式錯誤" });
      return;
    }

    const result = await TimetableService.addCourse(timetableId, user_id, courseId);
    if (!result.added && !result.alreadyExists && result.conflicts.length > 0) {
      res.status(409).json({
        message: "課程時段衝突，無法加入課表",
        ...result,
      });
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    handleTimetableError(res, err);
  }
};

export const batchAddTimetableFromInterests: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ message: "未授權的使用者" });
      return;
    }

    const timetableId = parsePositiveSafeInteger(req.params.timetableId);
    if (timetableId === null) {
      res.status(400).json({ message: "參數格式錯誤" });
      return;
    }

    const result = await TimetableService.batchAddFromInterests(timetableId, user_id);
    res.status(200).json(result);
  } catch (err) {
    handleTimetableError(res, err);
  }
};

export const swapTimetableCourse: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ message: "未授權的使用者" });
      return;
    }

    const timetableId = parseInt(req.params.timetableId);
    const courseId = Number(req.body?.courseId);
    if (Number.isNaN(timetableId) || Number.isNaN(courseId)) {
      res.status(400).json({ message: "參數格式錯誤" });
      return;
    }

    const result = await TimetableService.swapCourse(timetableId, user_id, courseId);
    res.status(200).json(result);
  } catch (err) {
    handleTimetableError(res, err);
  }
};

export const removeTimetableCourse: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      res.status(401).json({ message: "未授權的使用者" });
      return;
    }

    const timetableId = parsePositiveSafeInteger(req.params.timetableId);
    const courseId = parsePositiveSafeInteger(req.params.courseId);
    if (timetableId === null || courseId === null) {
      res.status(400).json({ message: "參數格式錯誤" });
      return;
    }

    await TimetableService.removeCourse(timetableId, user_id, courseId);
    res.status(204).send();
  } catch (err) {
    handleTimetableError(res, err);
  }
};
