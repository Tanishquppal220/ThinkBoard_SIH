import ratelimit from "../config/upstash.js";

const ratelimiter = async (req,res,next)=>{
    try{
        const {success} = await ratelimit.limit("my-limit-key");

        if(!success){
            return res.status(429).json({message:"Rate limit exceeded"});
        }
        next();
    } catch(e){
        console.log(e);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export default ratelimiter;