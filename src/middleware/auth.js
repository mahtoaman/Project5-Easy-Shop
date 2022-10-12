const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

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
    let token = req.headers["x-api-key"] || req.headers["X-API-KEY"];
    if (!token)
      return res
        .status(400)
        .send({ status: false, msg: "token must be present" });

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

module.exports = { authentication };
