import bcrypt from "bcryptjs"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"
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

        //creating token to verify user email 
        const verificationToken = crypto.randomBytes(32).toString('hex')

        //create new user 
        const newUser = await db.user.create({
            data:{
                email,
                password: hashedPassword,
                name,
                role: UserRole.USER,
                verificationToken
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

        //sending verification link through email

        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, // true for port 465, false for other ports
            auth: {
              user: process.env.MAILTRAP_USERNAME,
              pass: process.env.MAILTRAP_PASSWORD,
            },
          });
           
         
          const mailOption =({
            from: process.env.SENDER_ADDRESS, // sender address
            to: newUser.email, // list of receivers
            subject: `VERIFICATION EMAIL FROM ALGONIX`, // Subject line
            text: `Hi ${name},
                    We're happy you signed up for Algonix. To start
                    exploring the Algonix, please confirm your email address.`, // plain text body
            html: `
                <div>
                    <button>
                        <a href = "${process.env.BASE_URL}api/v1/auth/verify/${verificationToken}">
                            Click to verify
                        </a>
                    </button>
                    <p>
                        If above button don't work just copy paste this link in you browser search bar :
                        ${process.env.BASE_URL}api/v1/auth/verify/${verificationToken}
                    </p>
                </div> 
            `, // html body
          });

          await transporter.sendMail(mailOption)

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

export const verify = async (req,res) => {
    //taking token from params 
    const {verificationToken} = req.params

    //checking if token is provided or not 
    if(!verificationToken){
        return res.status(400).json({
            success:false,
            message:"Invalid token"
        })
    }

    try {
        //finding user on the basics of token given by user 
        const user = await prisma.user.findFirst({
            where: {
              verificationToken
            }
          });

        //if invalid token 
        if(!user){
            return res.status(400).json({
                success:false,
                message:"User not found"
            })
        }
        
        //if token is valid updating isVerified status and making verfication token null
        await db.user.update({
            where: { id: user.id },
            data: {
              isVerified: true,
              verificationToken: null,
            },
          });

          //return success status and message
          return res.status(200).json({
            success:true,
            message:`User Verified successfully`
          })

          //catch block
    } catch (error) {
        console.log(`Error encountered in verify catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in verify`,
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
        
        //checking if user is verified (if not asking to verify first)
        if(!user.isVerified){
            const transporter = nodemailer.createTransport({
                host: process.env.MAILTRAP_HOST,
                port: process.env.MAILTRAP_PORT,
                secure: false, // true for port 465, false for other ports
                auth: {
                  user: process.env.MAILTRAP_USERNAME,
                  pass: process.env.MAILTRAP_PASSWORD,
                },
              });
               
             
              const mailOption =({
                from: process.env.SENDER_ADDRESS, // sender address
                to: newUser.email, // list of receivers
                subject: `VERIFICATION EMAIL FROM ALGONIX`, // Subject line
                text: `Hi ${name},
                        We're happy you signed up for Algonix. To start
                        exploring the Algonix, please confirm your email address.`, // plain text body
                html: `
                    <div>
                        <button>
                            <a href = "${process.env.BASE_URL}api/v1/auth/verify/${verificationToken}">
                                Click to verify
                            </a>
                        </button>
                        <p>
                            If above button don't work just copy paste this link in you browser search bar :
                            ${process.env.BASE_URL}api/v1/auth/verify/${verificationToken}
                        </p>
                    </div> 
                `, // html body
              });
    
              await transporter.sendMail(mailOption)

              return res.status(400).json({
                success:false,
                message:`Please verify yourself and then try again.
                Latest verification link is send to your registered email address`
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

export const forgotPassword = async (req,res) => {

    //taking email from user
    const {email} = req.body
    if(!email){
        return res.status(400).json({
            success:false,
            message:`Email is required`
        })
    }

    try {
        //checking is user exist 
        const user = await db.user.findUnique({
            where: {
                email
            }
        })
        
        //if user not exist
        if(!user){
            return res.status(400).json({
                success:false,
                message:`User not found`
            })
        }

        // generating token
        const token = crypto.randomBytes(32).toString('hex')

        //saving token in db
        await db.user.update({
            where:{
                email
            },
            data:{
                resetPasswordToken: token,
                resetPasswordTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hr
            }
        })

        //sending token to user email for reseting password
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, // true for port 465, false for other ports
            auth: {
              user: process.env.MAILTRAP_USERNAME,
              pass: process.env.MAILTRAP_PASSWORD,
            },
          });
         
          const mailOption =({
            from: process.env.SENDER_ADDRESS, // sender address
            to: email, // list of receivers
            subject: `RESET PASSWORD EMAIL FROM ALGONIX`, // Subject line
            text: `Hi ${user.name},
                    To reset your password`, // plain text body
            html: `
                <div>
                    <button>
                        <a href = "${process.env.BASE_URL}api/v1/auth/reset-password/${token}">
                            Click to Reset 
                        </a>
                    </button>
                    <p>
                        If above button don't work just copy paste this link in you browser search bar :
                        ${process.env.BASE_URL}api/v1/auth/reset-password/${token}
                    </p>
                </div> 
            `, // html body
          });

          await transporter.sendMail(mailOption)

          return res.status(200).json({
            success:true,
            message:`Reset password email is send successfully`
          })



    } catch (error) {
        console.log(`Error encountered in forgot password catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in forgot password`,
            error
        })
    }
}

export const resetPassword = async (req,res) => {
    const {token}= req.params
    const {newPassword} = req.body
    if(!token ||!newPassword){
        return res.status(400).json({
            success:false,
            message:`Token and New Password is required`
        })
    }

    try {
        //checking if user exist 
        const user = await db.user.findFirst({
            where:{
                resetPasswordToken : token
            }
        })

        //if user is not exist 
        if(!user){
            return res.status(400).json({
                success:false,
                message:`Invalid token`
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword,10)
        await db.user.update({
            where:{
                email : user.email
            },
            data:{
                password : hashedPassword,
                resetPasswordToken: null
            }
        })

        return res.status(200).json({
            success:true,
            message:`Password reset successfully`
        })
    } catch (error) {
        console.log(`Error encountered in resetPassword catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in resetPassword`,
            error
        })
    }
}

export const changePassword = async (req,res) => {
    //taking new and old password through body from user
    const {oldPassword, newPassword} = req.body
    const userDetails = req.user

    //checking is both provided or not
    if(!oldPassword || !newPassword){
        return res.status(400).json({
            success:false,
            message:`Old and new Password is required`
        })
    } 

    try {
        //getting all detail about user from db 
        const user = await db.user.findUnique({
            where:{
                email : userDetails.email
            }
        })
        
        //matching password
        const isMatched = await bcrypt.compare(oldPassword, user.password)

        //if not matched
        if(!isMatched){
            return res.status(400).json({
                success:false,
                message:`Wrong password`
            })
        }

        //if matched
        
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)

        await db.user.update({
            where: {
                email : user.email,
            },
            data:{
                password: hashedNewPassword
            }
        })

        return res.status(200).json({
            success:true,
            message:`Password changed`
        })
        
    } catch (error) {
        console.log(`Error encountered in changePassword catch block : ${error}`);
        
        res.status(500).json({
            success: false,
            message : `Error encountered in change Password `,
            error
        })
    }
}
