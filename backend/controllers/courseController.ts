import CourseService, { ReviewRequestServiceError } from "../services/courseService";
import CourseViewService from "../services/courseViewService";
import { RequestHandler } from "express";
import { PERIOD_ORDER } from "../utils/courseSchedule";

const getQueryValues = (value: unknown): string[] => {
  if (value === undefined || value === null || value === "") return [];
  return String(value).split(",").map((item) => item.trim());
};

const getCourseOptionFilters = (query: Record<string, unknown>) => ({
  category: String(query.category || "") || undefined,
  academy: String(query.academy || "") || undefined,
  semesters: getQueryValues(query.semester ?? query.semesters).filter(Boolean),
});

export const getAllCourses: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 15, 1), 100);
    const offset = (page - 1) * limit;
    const weekdayValues = getQueryValues(req.query.weekdays);
    if (weekdayValues.some((value) => !/^[1-7]$/.test(value))) {
      res.status(400).json({ message: "星期篩選格式錯誤，weekdays 僅接受 1 至 7。" });
      return;
    }
    const weekdays = weekdayValues.map(Number);

    const allowedPeriods = new Set(PERIOD_ORDER);
    const periods = getQueryValues(req.query.periods).map((value) => value.toUpperCase());
    if (periods.some((period) => !allowedPeriods.has(period))) {
      res.status(400).json({ message: "節次篩選格式錯誤，periods 僅接受 1 至 9 或 A 至 G。" });
      return;
    }
    const semesters = String(req.query.semesters || "")
      .split(",")
      .map((item) => item.trim())
      .filter((value) => Boolean(value));
    const includeTimeslots = req.query.includeTimeslots === "true";

    const search = {
      search: String(req.query.search || ""),
      category: String(req.query.category || "all"),
      academy: String(req.query.academy || ""),
      department: String(req.query.department || ""),
      courseType: String(req.query.courseType || ""),
      weekdays,
      periods,
      semesters,
      sortBy: String(req.query.sortBy || "")
    };

    const courseResult = includeTimeslots
      ? await CourseService.getAllCourses({ page, limit, offset, search }, true)
      : await CourseService.getAllCourses({ page, limit, offset, search });
    const { courses, total } = courseResult;
    res.status(200).json({
      courses,
      pagination: {
        countPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const getAllDepartments: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const departments = await CourseService.getAllDepartments(getCourseOptionFilters(req.query));
    res.status(200).json({ departments });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const getAllAcademies: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const academies = await CourseService.getAllAcademies(getCourseOptionFilters(req.query));
    res.status(200).json({ academies });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const getCourse: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const ip = req.ip;
    const user_agent = req.headers['user-agent'] ?? '';

    const course_id = parseInt(req.params.course_id);
    const course = await CourseService.getCourse(user_id, course_id);
    
    if (course && (await CourseViewService.shouldInsertView(course_id, user_id, ip, user_agent))) {
      await CourseViewService.insertCourseView(course_id, user_id, ip, user_agent);
      await CourseService.addViewCount(course_id);
    }
    
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const getReviewRequestCourses: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const result = await CourseService.getReviewRequestCourses(
      req.query.semester,
      req.query.limit
    );
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof ReviewRequestServiceError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    res.status(500).json({ message: "取得求評價課程失敗" });
  }
};
