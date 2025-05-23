import express from "express"
import { authMiddleware } from "../middleware/auth.middleware.js"
import { executeCode } from "../controller/executeCode.controller.js"

const executionRoute = express.Router()

executionRoute.post("/", authMiddleware, executeCode)


export default executionRoute