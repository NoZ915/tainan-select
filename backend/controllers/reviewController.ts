import { RequestHandler } from "express";
import RreviewService from "../services/reviewService";

export const getAllReviewsByCourseId: RequestHandler = async(req, res): Promise<void> => {
    try{
        const course_id = parseInt(req.params.course_id);
        const reviews = await RreviewService.getAllReviewsByCourseId(course_id);
        res.status(200).json(reviews)
    }catch(err){
        res.status(500).json({ message: err });
    }
}