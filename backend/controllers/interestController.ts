import { RequestHandler } from "express";
import InterestService from "../services/interestService";

export const toggleInterest: RequestHandler = async(req, res): Promise<void> => {
    try{
        const user_id = req.user?.id;
        const {course_id} = req.body;
        if(user_id){
            await InterestService.toggleInterest(user_id, course_id);
        }
        res.status(200).json("Add interest success!");
    }catch(err){
        res.status(500).json({ message: err });
    }
}