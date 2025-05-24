import { getLanguageName, pollBatchResults, submitBatch } from "../libs/judge0.lib.js"
import {db} from "../libs/db.js"

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

        // Analyze test case results
        let allPassed = true
        const detailedResults = results.map((result, i)=>{
            const stdout = result.stdout?.trim()
            const expected_output = expected_outputs[i]?.trim()
            const passed = stdout ===expected_output

            if(!passed) allPassed= false
            return {
                testCase: i+1,
                passed,
                stdout,
                expected : expected_output,
                compile_output:result.compile_output|| null,
                status: result.status.description,
                memory: result.memory? `${result.memory} KB` : undefined,
                time: result.time ?`${result.time} s`: undefined,
            }
        })

        console.log(detailedResults);

        // store submission summary 
        const submission = await db.submission.create({
            data: {
                userId,
                problemId,
                sourceCode:source_code,
                language: getLanguageName(language_id),
                stdin:stdin.join("\n"),
                stdout: JSON.stringify(detailedResults.map((r)=>r.stdout)),
                stderr: detailedResults.some((r)=>r.stderr) ? JSON.stringify(detailedResults.map((r)=>r.stderr)) 
                : null,
                compliedOutput: detailedResults.some((r)=>r.compile_output) ? JSON.stringify(detailedResults.map((r)=>r.compile_output)) 
                : null,
                status: allPassed? "Accepted" : "Wrong Answer",
                memory: detailedResults.some((r)=>r.memory) ? JSON.stringify(detailedResults.map((r)=>r.memory)) 
                : null,
                time: detailedResults.some((r)=>r.time) ? JSON.stringify(detailedResults.map((r)=>r.time)) 
                : null,

            }
        })
        
        // if all passed = true marked problem as solved for the current user
        //logic is that if user solved first then mark problem as solved and create entry in db but if user again solve that problem in that case we can not mark problem as solved again because it is already marked thats why inside update their is no logic
        if(allPassed){
            await db.problemSolved.upsert({
                where:{
                    userId_problemId:{
                        userId, problemId
                    }
                },
                update:{},
                create:{
                    userId, problemId
                }
            })
        }
        
        // save individual test case results using detailedResult

        const testCaseResults = detailedResults.map((result)=>({
            submissionId: submission.id,
            testCase : result.testCase,
            passed: result.passed,
            stdout: result.stdout,
            expected: result.expected,
            stderr: result.stderr,
            compileOutput: result.compile_output,
            status: result.status,
            memory: result.memory,
            time: result.time
        }))

        await db.TestCaseResult.createMany({
            data: testCaseResults
        })
        // 
        const submissionWithTestCase = await db.submission.findUnique({
            where:{
                id: submission.id
            },
            include:{
                testCases: true
            }
        })

        return res.status(200).json({
            success: true,
            message:"Code Executed Successfully!",
            submission: submissionWithTestCase
        })
        
    } catch (error) {
        console.log(`Location : executeCode.controller.js 
            ${error}`);
      return res.status(500).json({
        error: "Failed to execute code",
      });
    }
}