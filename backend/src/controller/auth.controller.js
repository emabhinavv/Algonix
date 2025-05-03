import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
import {db} from "../libs/db.js"
import { UserRole } from "../generated/prisma/index.js"


export const register = async (req,res) => {
    const {email,password,name} = req.body

    //check if user has provided all values are not 
    if(!name || !email || !password){
        return res.status(400).json({
            success: false,
            message : `All fields are required`
        })
    }
    try {
        //check if user exist
        const existingUser = await db.user.findUnique({
            where:{
                email
            }
        })
        //if user exist
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message : `User already exist`
            })
        }

        //hash user password
        const hashedPassword = await bcrypt.hash(password, 10)

        //create new user 
        const newUser = await db.user.create({
            data:{
                email,
                password: hashedPassword,
                name,
                role: UserRole.USER
            }
        })

        // sign jwt token

        const token =  jwt.sign({id: newUser.id}, process.env.JWT_SECRET, {
            expiresIn: '1d'
        })

        //injecting token value in cookie 
        res.cookie("token", token , {
            httpOnly : true,
            sameSite: "strict",
            secure:process.env.NODE_ENV !== "development",
            maxAge : 24*60*60*1000 //24hrs
        })

        res.status(201).json({
            success:true,
            message: "User Created Successfully",
            user : {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                // image: newUser.image //TODO
            }
        })
    } catch (error) {
        console.log(`Error encountered in register catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in registering user`,
            error
        })
    }
}
export const login = async (req,res) => {
    const {email,password} = req.body

    //check if user has provided all values are not 
    if(!email || !password){
        return res.status(400).json({
            success: false,
            message : `All fields are required`
        })
    }
    try {
        //check if user exist
        const user = await db.user.findUnique({
            where:{
                email
            }
        })

        //if not user exist
        if (!user) {
            return res.status(400).json({
                success: false,
                message : `Invalid email or password `
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

       // is password not matched
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message : `Invalid email or password`
            })
        }

        // sign jwt token
        const token =  jwt.sign({id: user.id}, process.env.JWT_SECRET, {
            expiresIn: '1d'
        })

        //injecting token value in cookie 
        res.cookie("token", token , {
            httpOnly : true,
            sameSite: "strict",
            secure:process.env.NODE_ENV !== "development",
            maxAge : 24*60*60*1000 //24hrs
        })

        res.status(200).json({
            success:true,
            message: "User login Successfully",
            user : {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                // image: user.image //TODO
            }
        })

        
    } catch (error) {
        console.log(`Error encountered in login catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in login`,
            error
        })
    }
}
export const logout = async (req,res) => {
    try {
        //clear cookie

        res.clearCookie("token", {
            httpOnly : true,
            sameSite: "strict",
            secure:process.env.NODE_ENV !== "development",
        })
         
        //return status
        return res.status(200).json({
            success: true,
            message : `User logout successfully`
        })
    } catch (error) {
        console.log(`Error encountered in logout catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in logout`,
            error
        })
    }
    
}
export const check = async (req,res) => {
    
    try {
        return res.status(200).json({
            success:true,
            message: `User authenticated successfully`,
            user:req.user
        })
    } catch (error) {
        console.log(`Error encountered in check catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in check`,
            error
        })
    }
}