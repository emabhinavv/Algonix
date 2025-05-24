import express from "express"
import dotenv  from "dotenv"
import cookieParser from "cookie-parser"

//custom imports
import authRoutes from "./routes/auth.routes.js"
import {db} from "./libs/db.js"
import problemRoutes from "./routes/problem.routes.js"
import executionRoute from "./routes/executeCode.routes.js"
import submissionRoutes from "./routes/submission.routes.js"
import playlistRoutes from "./routes/playlist.routes.js"


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
app.get('/deleteAllUser', async (req, res) => {
    try {
        const deletedUsers = await db.user.deleteMany({});
        
        res.status(200).json({
            success: true,
            message: `${deletedUsers.count} user(s) deleted`,
        });

    } catch (error) {
        console.log(`error aagaya bhai: ${error}`);
        res.status(400).json({
            success: false,
            message: `Encountered error`,
        });
    }
});

app.get('/viewAllUser', async(req,res)=>{
    try {
        const existingUser = await db.user.findMany({
            where:{
            }
        })
        console.log(existingUser);
        res.status(200).json({
            success: true,
        })
        
    } catch (error) {
        console.log(`error aagaya bhai: ${error}`);
        res.status(400).json({
            success: false,
            message: `encounted error`
        })
    }
    
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/problems', problemRoutes)
app.use('/api/v1/execute-code', executionRoute)
app.use('/api/v1/submission', submissionRoutes)
app.use('/api/v1/playlist', playlistRoutes)

app.listen(port , ()=>{
    console.log(`Server is running on  ${port}`);
    
})