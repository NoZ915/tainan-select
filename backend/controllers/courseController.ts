import CourseService from "../services/courseService";
import { Request, RequestHandler, Response } from "express";

export const getAllCourses: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const offset = (page - 1) * limit;
    const search = {
      search: String(req.query.search || ""),
      category: String(req.query.category || "all"),
      academy: String(req.query.academy || ""),
      department: String(req.query.department || ""),
      courseType: String(req.query.courseType || ""),
    };

    const { courses, total } = await CourseService.getAllCourses({
      page,
      limit,
      offset,
      search,
    });
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
    const departments = await CourseService.getAllDepartments();
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
    const academies = await CourseService.getAllAcademies();
    res.status(200).json({ academies });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const getCourse: RequestHandler = async (req, res): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const course_id = parseInt(req.params.course_id);
    const course = await CourseService.getCourse(user_id, course_id);
    if(course) await CourseService.addViewCount(course_id);
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};

export const getMostCuriousButUnreviewedCourses: RequestHandler = async (
  req,
  res
): Promise<void> => {
  try {
    const courses = await CourseService.getMostCuriousButUnreviewedCourses();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
