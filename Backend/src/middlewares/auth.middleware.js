/* 
this code is for keep the user authenticated by verifying the JWT token sent in the Authorization header of the request. 
If the token is valid, it decodes the token and attaches the decoded user information to the request object for further use in the application. 
If the token is missing or invalid, it responds with a 401 Unauthorized status.
*/

// importing the jsonwebtoken library to handle JWT operations
const jwt = require("jsonwebtoken");

// middleware function to authenticate the user
function authMiddleware(req, res, next) {
  try {
    // taking the Authorization header from the request
    const authHeader =
      req.headers.authorization;

    // checking if the Authorization header is not present or does not start with "Bearer "
    if (
      !authHeader || !authHeader.startsWith(
        "Bearer "
      )
    ) {
      // returning a 401 Unauthorized response if the token is missing or not in the correct format
      return res.status(401).json({
        message: "Unauthorized",
      });
    }
    // store the token without the "Bearer " prefix
    const token =
      authHeader.replace(
        "Bearer ",
        ""
      );

    // verifying the token using the secret key defined in the environment variables
    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    // attaching the decoded user information to the request object for further use in the application
    req.user = decoded;
    
    // calling the next middleware function in the stack
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
}

module.exports =
  authMiddleware;