import {db} from '../libs/db.js'
import { getJudge0LanguageId, pollBatchResults, submitBatch } from '../libs/judge0.lib.js'


// export const createProblem = async (req,res) => {
//     // going to get all the data from the request body like title , description
//     const{title, description, difficulty, tags, examples, constraints, testCases, codeSnippets, referenceSolutions} = req.body
//     // going to user role  again
//     if(req.user.role !== "ADMIN"){
//         return res.status(403).json({
//             success: false,
//             message:"You are not allowed to create a problem"
//         })
//     }
//     // we are going to loop though each reference solution for different languages 
//     // we get the language id from judge0 (for "id":63 means js, "id":62 means java)

//     try {
//         //loop for every language for refrenceSoltution
//         for(const [language, solutionCode] of Object.entries(referenceSolutions)){
//             const languageId = getJudge0LanguageId(language)
//             if(!languageId){
//                 return res.status(400).json({
//                     success: false,
//                     error: `Language ${language} is not supported` 
//                 }) 
//             }

//             //getting submission body ready that we will send to judge0
//             const submissions =testCases.map(({input, output})=>({
//                 source_code: solutionCode,
//                 language_id: languageId,
//                 std_in:input,
//                 expected_output:output,
//             }))
    
//             const submissionResults = await submitBatch(submissions) //creating batches of submission 

//             const tokens = submissionResults.map((res)=>res.token) 
//             const results = await pollBatchResults(tokens)

//             for(let i =0; i< results.length; i++){
//                 const result = results[i]
//                 // console.log(`Result : ${result}`);
//                 console.log(
//                     `Testcase ${i+1} and language ${language}------------- result ${JSON.stringify(result.status.description)}`
//                 );
                
//                 if(result.status.id !==3){
//                     return res.status(400).json({
//                         success:false,
//                         error:`Testcase ${i+1} failed for language ${language}`
//                     })
//                 }
//             }
//         }
//         // save the problem to the database
//         const newProblem = await db.problem.create({
//             data:{
//                     title,
//                     description,
//                     difficulty,
//                     tags,
//                     examples,
//                     constraints,
//                     testCases,
//                     codeSnippets,
//                     referenceSolutions,
//                     userId: req.user.id
//                 }
//         })

//         return res.status(201).json({
//             success:true,
//             message:`Problem created successfully`,
//             newProblem
//         })
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             success:false,
//             error: `Error while creating Problem`
//         })
        
//     }
// }

export const createProblem = async (req, res) => {
    const {
      title,
      description,
      difficulty,
      tags,
      examples,
      constraints,
      testCases,
      codeSnippets,
      referenceSolutions,
    } = req.body;
  
    // going to check the user role once again
    if(req.user.role !== "ADMIN"){
                return res.status(403).json({
                    success: false,
                    message:"You are not allowed to create a problem"
                })
            }
  
    try {
      for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
        const languageId = getJudge0LanguageId(language);
  
        if (!languageId) {
          return res
            .status(400)
            .json({ error: `Language ${language} is not supported` });
        }
  
        //
        const submissions = testCases.map(({ input, output }) => ({
          source_code: solutionCode,
          language_id: languageId,
          std_in: input,
          expected_output: output,
        }));
  
        const submissionResults = await submitBatch(submissions);
  
        const tokens = submissionResults.map((res) => res.token);
  
        const results = await pollBatchResults(tokens);
  
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          console.log("Result:", result);
          // console.log(
          //   `Testcase ${i + 1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
          // );
          if (result.status.id !== 3) {
            return res.status(400).json({
              error: `Testcase ${i + 1} failed for language ${language}`,
            });
          }
        }
      }
  
      const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficulty,
          tags,
          examples,
          constraints,
          testCases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });
  
      return res.status(201).json({
        sucess: true,
        message: "Message Created Successfully",
        problem: newProblem,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        error: "Error While Creating Problem",
      });
    }
  };
export const getAllProblems = async (req,res) => {
    try {
        const problems = await db.problem.findMany()

        if(!problems){
            return res.status(404).json({
                sucess:false,
                error:`No problem found`
                
            })
        }

        res.status(200).json({
            sucess:true,
            message:"Fetched successfully",
            problems
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          error: "Error While fetching Problems",
        });  
    }
}

export const getProblemById = async (req,res) => {
    const {id} = req.params

    try {
        const problem = await db.problem.findUnique({
            where:{
                id
            }
        })

        if(!problem){
            return res.status(404).json({
                sucess:false,
                error:`Problem not found`
                
            })
        }
        res.status(200).json({
            sucess:true,
            message:"Fetched successfully",
            problem
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          error: "Error While fetching Problem by id",
        }); 
    }
}

export const updateProblem = async (req,res) => {
    const {id} = req.params
    const {
        title,
        description,
        difficulty,
        tags,
        examples,
        constraints,
        testCases,
        codeSnippets,
        referenceSolutions,
      } = req.body;
    try {
        const problem = await db.problem.findUnique({
            where:{
                id
            }
        })

        if(!problem){
            return res.status(404).json({
                sucess:false,
                error:`Problem not found`
                
            })
        }
        // checking again user role is admin or not
        if(req.user.role !== "ADMIN"){
            return res.status(403).json({
                success: false,
                message:"You are not allowed to update a problem"
            })
        }
        for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
            const languageId = getJudge0LanguageId(language);
      
            if (!languageId) {
              return res
                .status(400)
                .json({ error: `Language ${language} is not supported` });
            }
      
            //
            const submissions = testCases.map(({ input, output }) => ({
              source_code: solutionCode,
              language_id: languageId,
              std_in: input,
              expected_output: output,
            }));
      
            const submissionResults = await submitBatch(submissions);
      
            const tokens = submissionResults.map((res) => res.token);
      
            const results = await pollBatchResults(tokens);
      
            for (let i = 0; i < results.length; i++) {
              const result = results[i];
              console.log("Result:", result);
              // console.log(
              //   `Testcase ${i + 1} and Language ${language} ----- result ${JSON.stringify(result.status.description)}`
              // );
              if (result.status.id !== 3) {
                return res.status(400).json({
                  error: `Testcase ${i + 1} failed for language ${language}`,
                });
              }
            }
          }
      
          const problemUpdate = await db.problem.update({
            where:{
                id
            },
            data: {
              title,
              description,
              difficulty,
              tags,
              examples,
              constraints,
              testCases,
              codeSnippets,
              referenceSolutions,
              userId: req.user.id,
            },
          });
      
          return res.status(201).json({
            sucess: true,
            message: "Updated Successfully",
            problem: problemUpdate,
          });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          error: "Error While updating Problem",
        }); 
    }
}

export const deleteProblem = async (req,res) => {
    const {id} = req.params
    try {
        //checking is problem exist or not
        const problem = await db.problem.findUnique({where:{id}})
        if(!problem){
            return res.status(404).json({
                sucess:false,
                error:`Problem not found`
                
            })
        }
        //checking again user role is admin or not 
        if(req.user.role !== "ADMIN"){
            return res.status(403).json({
                success: false,
                message:"You are not allowed to delete a problem"
            })
        }
        //delete problem
        await db.problem.delete({where:{id}})
        return res.status(200).json({
            success:true,
            message:`Problem deleted successfully`
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          error: "Error While deleting Problem",
        }); 
    }
}

export const getAllProblemsSolvedByUser = async (req,res) => {
    try {
      const problems = await db.problem.findMany({
        where:{
          solvedBy:{
            some:{
              userId: req.user.id
            }
          }
        },
        include:{
          solvedBy:{
            where:{
              userId: req.user.id
            }
          }
        }
      })

      res.status(200).json({
        success:true,
        message:"Problem fetched successfully",
        problems
      })
    } catch (error) {
      console.log(`Location : problem.controller.js getAllProblemsSolvedByUser
        ${error}`);
    return res.status(500).json({
        error: "Failed to fetch problems solved by user.",
        });
    }
}
