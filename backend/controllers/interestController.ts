import { RequestHandler } from "express";
import InterestService from "../services/interestService";

export const toggleInterest: RequestHandler = async(req, res): Promise<void> => {
    try{
        const user_id = req.user?.id;
        const {course_id} = req.body;
        if(!user_id){
            res.status(401).json({ message: "未授權的使用者" });
            return;
        }
        const result = await InterestService.toggleInterest(user_id, course_id);
        res.status(200).json(result);
    }catch(err){
        res.status(500).json({ message: err });
    }
}