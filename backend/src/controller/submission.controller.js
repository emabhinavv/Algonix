import { db } from "../libs/db.js"

export const getAllSubmissions = async (req, res) => {
    const userId = req.user.id
    try {
        const submissions = await db.submission.findMany({
            where: {
                userId: userId
            }
        })

        res.status(200).json({
            success: true,
            message: `Submission fetched successfully`,
            submissions
        })
    } catch (error) {
        console.log(`Location : submission.controller.js getAllSubmission
            ${error}`);
        return res.status(500).json({
            error: "Failed to fetch Submission",
        });
    }
}
export const getSubmissionsForProblem = async (req, res) => {
    const userId = req.user.id
    const problemId = req.params.problemId
    try {
        const submissions = await db.submission.findMany({
            where: {
                userId: userId,
                problemId: problemId
            }
        })
        res.status(200).json({
            success: true,
            message: `Submission fetched successfully`,
            submissions
        })
    } catch (error) {
        console.log(`Location : submission.controller.js getSubmissionsForProblem
            ${error}`);
        return res.status(500).json({
            error: "Failed to fetch Submission",
        });
    }
}
export const getAllTheSubmissionsForProblem = async (req, res) => {
    const problemId = req.params.problemId
    try {
        const submissions = await db.submission.count({
            where: {
                problemId: problemId
            }
        })
        res.status(200).json({
            success: true,
            message: `Submission fetched successfully`,
            submissions
        })
    } catch (error) {
        console.log(`Location : submission.controller.js getAllTheSubmissionsForProblem
            ${error}`);
        return res.status(500).json({
            error: "Failed to fetch Submission",
        });
    }
}