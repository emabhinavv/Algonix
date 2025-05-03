import jwt from "jsonwebtoken";
import {db} from "../libs/db.js";

export const authMiddleware = async (req,res, next) => {
    try {
        const token = req.cookies.token
        if (!token) {
            return res.status(401).json({
                success:false,
                message:`Invalid token`
            })
        }

        let decoded

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET)
        } catch (error) {
            console.log(`error encountered in auth middleware: ${error}`);
            return res.status(400).json({
                success:false,
                message:`Invalid token`
            })
            
        }

        const user = await db.user.findUnique({
            where:{
                id:decoded.id
            },
            select:{
                id:true,
                name:true,
                email:true,
                role:true,
                // image:true //in future
            }
        })
         
        //if user not found
        if(!user){
            return res.status(400).json({
                success:false,
                message:`User not found`
            })
        }

        //attaching user in request 
        req.user = user
        next()
        
    } catch (error) {
        console.log(`error encountered in catch block in auth middleware: ${error}`);
            return res.status(400).json({
                success:false,
                message:`error authenticating user`
            })
    }
}