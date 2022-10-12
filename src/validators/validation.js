const mongoose = require("mongoose");

const isValidEmail = function (mail) {
  if (/^[a-z0-9_]{1,}@[a-z]{3,}[.]{1}[a-z]{3,6}$/.test(mail)) {
    return true;
  }
};

const isValidPassword = function (password) {
  if (
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(
      password
    )
  )
    return true;
  return false;
};

const isValidName = function (name) {
  if (/^[a-zA-Z\. ]*$/.test(name)) return true;
  return false;
};

const isValidPhone = function (phone) {
  if (/^[\s]*[6-9]\d{9}[\s]*$/gi.test(phone)) return true;
  return false;
};

const isValidPincode = function (pincode) {
  if (/^[1-9]{1}[0-9]{5}|[1-9]{1}[0-9]{3}\\s[0-9]{3}/.test(pincode))
    return true;
  return false;
};

const isValidstreet = function (street) {
  if (/^[A-Za-z]{3,15}/.test(street)) return true;
  return false;
};

const isValidRequestBody = function (requestBody) {
  if (Object.keys(requestBody).length > 0) return true;
  return false;
};

const isValidObjectId = function (objectId) {
  return mongoose.Types.ObjectId.isValid(objectId);
};

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

module.exports = {
  isValid,
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidPhone,
  isValidPincode,
  isValidstreet,
  isValidRequestBody,
  isValidObjectId,
};
