import { RequestHandler } from "express";
import InterestService from "../services/interestService";

export const addInterest: RequestHandler = async(req, res): Promise<void> => {
    try{
        const user_id = req.user?.id;
        const {course_id} = req.body;
        if(user_id){
            await InterestService.addInterest(user_id, course_id);
        }
        res.status(200).json("Add interest success!");
    }catch(err){
        res.status(500).json({ message: err });
    }
}