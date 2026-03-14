import { RequestHandler } from "express";
import AdminRelatedPostService from "../services/adminRelatedPostService";
import { ManualCourseKeywordOverride } from "../types/admin";
import UserService from "../services/userService";
import { DcardImportValidationError } from "../utils/dcardImportParser";

const getErrorStatus = (error: unknown): number =>
  error instanceof DcardImportValidationError ? 400 : 500;

const parseBoundedNumber = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.min(Math.max(parsed, min), max);
};

export const getAdminStatus: RequestHandler = async (req, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const user = await UserService.getUserById(req.user.id);
    res.status(200).json({
      isAdmin: Boolean(user?.is_admin),
    });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "取得管理員狀態失敗" });
  }
};

export const getRelatedPostOverview: RequestHandler = async (req, res): Promise<void> => {
  try {
    const recentPostsPage = Math.max(1, Number(req.query?.recentPostsPage ?? 1) || 1);
    const recentImportsPage = Math.max(1, Number(req.query?.recentImportsPage ?? 1) || 1);
    const overview = await AdminRelatedPostService.getOverview(recentPostsPage, recentImportsPage);
    res.status(200).json(overview);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "取得相關貼文總覽失敗" });
  }
};

export const importDcardSource: RequestHandler = async (req, res): Promise<void> => {
  try {
    const input = typeof req.body?.input === "string" ? req.body.input : "";
    const rawInput = typeof req.body?.rawInput === "string" ? req.body.rawInput : undefined;
    const replaceExisting = Boolean(req.body?.replaceExisting);

    if (!input.trim()) {
      res.status(400).json({ message: "input 不可為空" });
      return;
    }

    const result = await AdminRelatedPostService.importDcardSource(
      input,
      replaceExisting,
      rawInput,
      req.user?.id ?? null
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: error instanceof Error ? error.message : "匯入 Dcard 資料失敗" });
  }
};

export const previewImportDcardSource: RequestHandler = async (req, res): Promise<void> => {
  try {
    const input = typeof req.body?.input === "string" ? req.body.input : "";

    if (!input.trim()) {
      res.status(400).json({ message: "input 不可為空" });
      return;
    }

    const result = await AdminRelatedPostService.previewDcardSource(input);
    res.status(200).json(result);
  } catch (error) {
    res.status(getErrorStatus(error)).json({ message: error instanceof Error ? error.message : "預覽 Dcard 資料失敗" });
  }
};

export const syncRelatedPostsFromGoogle: RequestHandler = async (req, res): Promise<void> => {
  try {
    const limit = parseBoundedNumber(req.body?.limit, 30, 1, 200);
    const maxResultsPerCourse = parseBoundedNumber(req.body?.maxResultsPerCourse, 5, 1, 10);
    const onlyUnreviewed = Boolean(req.body?.onlyUnreviewed);
    const replaceExisting = Boolean(req.body?.replaceExisting);
    const semester =
      typeof req.body?.semester === "string" && req.body.semester.trim().length > 0
        ? req.body.semester.trim()
        : undefined;

    const result = await AdminRelatedPostService.syncGoogleResults({
      limit,
      onlyUnreviewed,
      semester,
      replaceExisting,
      maxResultsPerCourse,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Google 搜尋同步失敗" });
  }
};

export const attachRelatedPostToCourses: RequestHandler = async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "id is invalid" });
      return;
    }

    const courseIds = Array.isArray(req.body?.course_ids) ? req.body.course_ids : [];
    const courseKeywordOverrides = Array.isArray(req.body?.course_keyword_overrides)
      ? req.body.course_keyword_overrides as ManualCourseKeywordOverride[]
      : [];
    const result = await AdminRelatedPostService.attachRelatedPostToCourses(id, courseIds, courseKeywordOverrides);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "Failed to attach related post courses" });
  }
};

export const deleteRelatedPost: RequestHandler = async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "id 無效" });
      return;
    }

    await AdminRelatedPostService.deleteRelatedPost(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "刪除相關貼文失敗" });
  }
};

export const deleteRelatedPostImport: RequestHandler = async (req, res): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "id 無效" });
      return;
    }

    await AdminRelatedPostService.deleteRelatedPostImport(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : "刪除匯入紀錄失敗" });
  }
};
