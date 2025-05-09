import express from "express"
import { changePassword, check, forgotPassword, login, logout, register, resetPassword, verify } from "../controller/auth.controller.js"
import { authMiddleware } from "../middleware/auth.middleware.js"

const authRoutes = express.Router()

authRoutes.post('/register', register)
authRoutes.get('/verify/:verificationToken', verify)
authRoutes.post('/login', login)
authRoutes.get('/logout', logout)
authRoutes.get('/check',authMiddleware, check)
authRoutes.post('/forgot-password', forgotPassword)
authRoutes.post('/reset-password', resetPassword)
authRoutes.get('/change-password', changePassword)

export default authRoutes