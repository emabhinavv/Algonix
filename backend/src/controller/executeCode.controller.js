import { pollBatchResults, submitBatch } from "../libs/judge0.lib.js"

export const executeCode = async (req, res) => {
    const {source_code, language_id, stdin, expected_outputs, problemId} = req.body
    const userId = req.user.id

    try {
        //Validate test case whether it is in proper array format or not

        if(
            !Array.isArray(stdin) || 
            stdin.length === 0 || 
            !Array.isArray(expected_outputs)||
            expected_outputs.length !== stdin.length
        ){
            return res.status(400).json({
                success: false,
                error:`Invalid or missiing test cases`
            })
        }

         // prepare each test case for judge0 batch submission 
         const submissions = stdin.map((input)=>({
            source_code,
            language_id,
            stdin: input,
         }))

        //  send this batch of submissions to judge0
        const submitRespone = await submitBatch(submissions)

        const tokens = submitRespone.map((res)=>res.token)

        // poll the judge0 for results of all submitted test cases
        const results = await pollBatchResults(tokens)
        console.log(`Results-----------------`);
        console.log(results);
        
        res.status(200).json({
            success: true,
            message:"Code Executed"
        })
        
    } catch (error) {
        
    }
}