const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const { uploadFile } = require("../aws/aws");
const {
  isValidObjectId,
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidPhone,
  isValidPincode,
  isValidstreet,
  isValidRequestBody,
} = require("../validators/validation");
const jwt = require("jsonwebtoken");

//============================================CREATE USER ============================================

const createUser = async function (req, res) {
  try {
    let data = req.body;
    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "please give some data" });

    const { fname, lname, email, phone, password, address } = data; //Destructuring

    if (!fname)
      return res
        .status(400)
        .send({ status: false, message: "fname is mandatory" });
    if (!isValidName(fname))
      return res
        .status(400)
        .send({ status: false, message: "fname is invalid" });

    if (!lname)
      return res
        .status(400)
        .send({ status: false, message: "lname is mandatory" });
    if (!isValidName(lname))
      return res
        .status(400)
        .send({ status: false, message: "lname is invalid" });

    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "email is mandatory" });
    if (!isValidEmail(email))
      return res
        .status(400)
        .send({ status: false, message: "email is invalid" });
    let emailExist = await userModel.findOne({ email });
    if (emailExist)
      return res.status(400).send({
        status: false,
        message: "user with this email already exists",
      });

    //Uploading image to S3 bucket
    let file = req.files;
    if (file && file.length > 0) {
      let uploadImage = await uploadFile(file[0]);
      data.profileImage = uploadImage;
    } else {
      res.status(400).send({ msg: "No file found" });
    }

    if (!phone)
      return res
        .status(400)
        .send({ status: false, message: "phone is mandatory" });
    if (!isValidPhone(phone))
      return res
        .status(400)
        .send({ status: false, message: "phone is invalid" });
    let phoneExist = await userModel.findOne({ phone });
    if (phoneExist)
      return res.status(400).send({
        status: false,
        message: "user with this phone number already exists",
      });

    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "password is mandatory" });
    if (!isValidPassword(password))
      return res
        .status(400)
        .send({ status: false, message: "password is invalid" });

    if (address.shipping) {
      if (!address.shipping.street)
        return res
          .status(400)
          .send({ status: false, message: "In shipping, street is mandatory" });
      if (address.shipping.street) {
        if (!isValidstreet(address.shipping.street))
          return res
            .status(400)
            .send({ status: false, message: "In shipping, street is invalid" });
      }
      if (!address.shipping.city)
        return res
          .status(400)
          .send({ status: false, message: "In shipping, city is mandatory" });
      if (address.shipping.city) {
        if (!isValidstreet(address.shipping.city))
          return res
            .status(400)
            .send({ status: false, message: "In shipping, city is invalid" });
      }

      if (!address.shipping.pincode)
        return res.status(400).send({
          status: false,
          message: "In shipping, pincode is mandatory",
        });
      if (address.shipping.pincode) {
        if (!isValidPincode(address.shipping.pincode))
          return res.status(400).send({
            status: false,
            message: "In shipping, pincode is invalid",
          });
      }
    }

    if (address.billing) {
      if (!address.billing.street)
        return res
          .status(400)
          .send({ status: false, message: "In billing, street is mandatory" });
      if (address.billing.street) {
        if (!isValidstreet(address.billing.street))
          return res
            .status(400)
            .send({ status: false, message: "In billing, street is invalid" });
      }

      if (!address.billing.city)
        return res
          .status(400)
          .send({ status: false, message: "In billing, city is mandatory" });
      if (address.billing.city) {
        if (!isValidstreet(address.billing.city))
          return res
            .status(400)
            .send({ status: false, message: "In billing, city is invalid" });
      }

      if (!address.billing.pincode)
        return res
          .status(400)
          .send({ status: false, message: "In billing, pincode is mandatory" });
      if (address.billing.pincode) {
        if (!isValidPincode(address.billing.pincode))
          return res
            .status(400)
            .send({ status: false, message: "In billing, pincode is invalid" });
      }
    }

    //Saving password in encrypted format
    let salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(data.password, salt);
    const user = await userModel.create(data);
    return res.status(201).send({
      status: true,
      message: "user is successfully created",
      data: user,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//===================================LOGIN==========================================
const userLogin = async function (req, res) {
  try {
    let data = req.body;
    let { email, password } = data;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Please Enter data" });

    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "Please enter email" });
    if (!isValidEmail(email))
      return res
        .status(400)
        .send({ status: false, message: "Please enter valid email" });

    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "Please enter password" });

    const Login = await userModel.findOne({ email });
    if (!Login)
      return res
        .status(400)
        .send({ status: false, message: "Not a register email Id" });

    //----------[Password Verification]
    let decodePwd = await bcrypt.compare(password, Login.password);
    if (!decodePwd)
      return res
        .status(400)
        .send({ status: false, message: "Password not match" });

    //----------[JWT token generate]
    let token = jwt.sign(
      {
        userId: Login._id.toString(),
      },
      "As calm as the sea",
      { expiresIn: "50d" }
    );

    res.setHeader("x-api-key", token);

    return res.status(200).send({
      status: true,
      message: "User login successfull",
      data: { userId: Login._id, token: token },
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=================================GET PROFILE ====================================================================

const getProfile = async function (req, res) {
  try {
    const userId = req.params.userId;

    if (!isValidObjectId(userId))
      return res
        .status(400)
        .send({ status: false, message: "Not a valid userId" });

    const checkUser = await userModel.findById(userId);
    if (!checkUser)
      return res.status(400).send({ status: false, message: "UserId invalid" });

    return res
      .status(200)
      .send({ status: true, message: "User profile details", data: checkUser });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//======================================================UPDATE USER=====================================================

const updateUser = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    const { fname, lname, email, phone, password, address } = data;

    if (!isValidObjectId(userId)) {
      return res.status(400).send({
        status: false,
        message: "Please enter valid Object Params Id",
      });
    }

    let user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(400)
        .send({ status: false, message: "User does not exist" });
    }

    //AUTHORIZATION
    // let loginUserId = req.headers.userId;
    // if (loginUserId !== userId) {
    //   return res
    //     .status(403)
    //     .send({ status: false, message: "You are not authorised" });
    // }

    if (!isValidRequestBody(data))
      return res
        .status(400)
        .send({ status: false, message: "please give some data" });

    let updateQueries = {};

    if (req.files.length) {
      let files = req.files;
      let uploadedImage = await uploadFile(files[0]);
      updateQueries["profileImage"] = uploadedImage;
    }

    if (fname) {
      if (!isValidName(fname))
        return res
          .status(400)
          .send({ status: false, message: "fname is invalid" });
      updateQueries["fname"] = fname;
    }

    if (lname) {
      if (!isValidName(lname))
        return res
          .status(400)
          .send({ status: false, message: "lname is invalid" });
      updateQueries["lnmae"] = lname;
    }

    if (email) {
      if (!isValidEmail(email))
        return res
          .status(400)
          .send({ status: false, message: "email is invalid" });
      updateQueries["email"] = email;
    }

    let emailExist = await userModel.findOne({ email: email });
    if (emailExist)
      return res.status(400).send({
        status: false,
        message: "user with this email already exists",
      });

    if (phone) {
      if (!isValidPhone(phone))
        return res
          .status(400)
          .send({ status: false, message: "phone is invalid" });

      let phoneExist = await userModel.findOne({ phone: phone });
      if (phoneExist)
        return res.status(400).send({
          status: false,
          message: "user with this phone number already exists",
        });
      updateQueries["phone"] = phone;
    }

    if (password) {
      if (password && !isValidPassword(password))
        return res
          .status(400)
          .send({ status: false, message: "password is invalid" });

      //Saving password in encrypted format
      let salt = await bcrypt.genSalt(10);
      updateQueries["password"] = await bcrypt.hash(data.password, salt);
    }

    if (address.shipping) {
      if (address.shipping.street) {
        if (!isValidstreet(address.shipping.street))
          return res.status(400).send({
            status: false,
            message: "In shipping, street is invalid",
          });
        updateQueries["address.shipping.street"] = address.shipping.street;
      }
      if (address.shipping.city) {
        if (!isValidstreet(address.shipping.city))
          return res
            .status(400)
            .send({ status: false, message: "In shipping, city is invalid" });
        updateQueries["address.shipping.city"] = address.shipping.city;
      }

      if (address.shipping.pincode) {
        if (!isValidPincode(address.shipping.pincode))
          return res.status(400).send({
            status: false,
            message: "In shipping, pincode is invalid",
          });
        updateQueries["address.shipping.pincode"] = address.shipping.pincode;
      }
    }

    if (address.billing) {
      if (address.billing.street) {
        if (!isValidstreet(address.billing.street))
          return res
            .status(400)
            .send({ status: false, message: "In billing, street is invalid" });
        updateQueries["address.billing.street"] = address.billing.street;
      }

      if (address.billing.city) {
        if (!isValidstreet(address.billing.city))
          return res
            .status(400)
            .send({ status: false, message: "In billing, city is invalid" });
        updateQueries["address.billing.city"] = address.billing.city;
      }

      if (address.billing.pincode) {
        if (!isValidPincode(address.billing.pincode))
          return res.status(400).send({
            status: false,
            message: "In billing, pincode is invalid",
          });
        updateQueries["address.billing.pincode"] = address.billing.pincode;
      }
    }

    console.log(updateQueries);
    let updatedData = await userModel.findOneAndUpdate(
      { _id: userId },
      updateQueries,
      {
        new: true,
      }
    );

    return res.status(200).send({
      status: true,
      message: "User profile details",
      data: updatedData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createUser, userLogin, getProfile, updateUser };
