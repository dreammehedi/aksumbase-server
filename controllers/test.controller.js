import jwt from "jsonwebtoken";

export const shouldBeLoggedIn = (req, res) => {   
    console.log(req.userId);
    res.status(200).json({message: "You are authenticated!"});
    // const token = req.cookies.token;
    // if (!token) return res.status(401).json("You are not authenticated!");

    // jwt.verify(token, process.env.JWT_SECRET, (err, userInfo) => {
    //     if (err) return res.status(403).json({message: "Token is not valid!"});
    //     req.userId = userInfo.id;
    //     return res.status(200).json({message: "You are authenticated!"});
    // });
}

export const shouldBeAdmin = (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json("You are not authenticated!");

    jwt.verify(token, process.env.JWT_SECRET, (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid!");
        if (!userInfo.isAdmin) {    
            return res.status(403).json("You are not authorized to access this resource!");
        }
        req.userId = userInfo.id;
        return res.status(200).json({message: "You are authenticated as admin!"});
    });
}   
