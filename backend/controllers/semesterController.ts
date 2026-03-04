import { RequestHandler } from "express";
import CourseService from "../services/courseService";

const parseSemesterCode = (value: string): { year: number; term: number } | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const splitMatch = trimmed.match(/^(\d+)\s*[-_/]\s*(\d+)$/);
  if (splitMatch) {
    return {
      year: Number(splitMatch[1]),
      term: Number(splitMatch[2]),
    };
  }

  const compactMatch = trimmed.match(/^(\d+)([1-9])$/);
  if (compactMatch) {
    return {
      year: Number(compactMatch[1]),
      term: Number(compactMatch[2]),
    };
  }

  return null;
};

const compareSemestersDesc = (a: string, b: string): number => {
  const parsedA = parseSemesterCode(a);
  const parsedB = parseSemesterCode(b);

  if (parsedA && parsedB) {
    if (parsedA.year !== parsedB.year) return parsedB.year - parsedA.year;
    if (parsedA.term !== parsedB.term) return parsedB.term - parsedA.term;
  } else if (parsedA && !parsedB) {
    return -1;
  } else if (!parsedA && parsedB) {
    return 1;
  }

  return b.localeCompare(a);
};

export const getAllSemesters: RequestHandler = async (req, res): Promise<void> => {
  try {
    const semesters = await CourseService.getAllSemesters();
    res.status(200).json({
      items: semesters.sort(compareSemestersDesc),
    });
  } catch (err) {
    res.status(500).json({ message: err });
  }
};
