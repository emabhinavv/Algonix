import express from "express"
import dotenv  from "dotenv"
import cookieParser from "cookie-parser"

//custom imports
import authRoutes from "./routes/auth.routes.js"


dotenv.config()

const app = express()

app.use(express.json())
app.use(cookieParser())

const port = process.env.PORT || 7777
app.get('/',(req,res)=>{
    res.send(
        "Hello! welcome to Algonix"
    )
})

app.use('/api/v1/auth', authRoutes)

app.listen(port , ()=>{
    console.log(`Server is running on  ${port}`);
    
})