const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const { isValidObjectId } = require("../validators/validation");

// const authentication = async function (req, res, next) {
//     try {
//         let token = req.authorization
//         if (!token) return res.status(401).send({status: false , msg: "token must be present"})
//         let decodeToken = jwt.verify(token, "GroupNumber39")
//         if (!decodeToken) return res.status(500).send({ msg: "token is inValid", status: false })
//         req.decodeToken=decodeToken
//         next()
//     } catch (err) {
//         res.status(500).send({ msg: "ERROR", error: err.message })
//     }
// }

const authentication = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    // console.log(token)
    if (!token)
      return res
        .status(400)
        .send({ status: false, msg: "token must be present" });
    token = req.headers.authorization.split(" ")[1];

    jwt.verify(token, "As calm as the sea", (err, decodedToken) => {
      if (err) {
        let message =
          err.message === "jwt expired"
            ? "token is expired"
            : "token is invalid";
        return res.status(401).send({ status: false, message: message });
      }
      req.headers = decodedToken;
      next();
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=========================AUTHORIZATION FOR USER UDPATE===============================

const isUserAuthorised = async (req, res, next) => {
  let userId = req.params.userId;

  if (!isValidObjectId(userId))
    return res.status(403).send({ status: false, message: "Invalid UserId" });

  let isUserPresent = await userModel.findById(userId);
  if (!isUserPresent)
    return res
      .status(404)
      .send({ status: false, message: "User does not exist" });

  let loginUserId = req.headers.userId;
  if (loginUserId !== userId) {
    return res
      .status(403)
      .send({ status: false, message: "You are not authorised" });
  }
  next();
};
//-------------------------------------------------------------------------------------
module.exports = { authentication, isUserAuthorised };
