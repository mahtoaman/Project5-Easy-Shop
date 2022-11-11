const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const {
  isValidRequestBody,
  isValidObjectId,
} = require("../validators/validation");

//=================================CREATE ORDER=========================================

const createOrder = async function (req, res) {
  try {
    let userId = req.params.userId;

    let data = req.body;
    if (!isValidRequestBody(data))
      return res
        .status(400)
        .send({ status: false, message: "Data is missing" });

    let { cartId, status, cancellable } = data;

    if (!cartId)
      return res
        .status(400)
        .send({ status: false, message: "Cart ID is required" });

    if (!isValidObjectId(cartId))
      return res
        .status(400)
        .send({ status: false, message: "Please provide valid cart Id" });

    let findCart = await cartModel.findOne({ _id: cartId });
    if (!findCart)
      return res
        .status(404)
        .send({ status: false, message: "No cart exist for this user" });
        
    if (findCart.items.length === 0)
      return res
        .status(400)
        .send({ status: false, message: "No Item in Cart" });

    if (userId != findCart.userId.toString())
      return res.status(400).send({
        status: false,
        message: "cartId is not correct for the given user",
      });

    if (status || typeof status == "string") {
      if (status != "pending") {
        return res.status(400).send({
          status: false,
          message: "status can contain only pending",
        });
      }
    }

    if (cancellable || typeof cancellable == "string") {
      cancellable = cancellable.toLowerCase().trim();
    }

    let totalQuantity = 0;
    for (let i = 0; i < findCart.items.length; i++) {
      totalQuantity += findCart.items[i].quantity;
    }

    data.userId = userId;
    data.items = findCart.items;
    data.totalPrice = findCart.totalPrice;
    data.totalItems = findCart.totalItems;
    data.totalQuantity = totalQuantity;

    let order = await orderModel.create(data);

    const deleteCart = await cartModel.findOneAndUpdate(
      { _id: cartId },
      { items: [], totalPrice: 0, totalItems: 0 }
    );

    return res
      .status(201)
      .send({ status: true, message: "Success", data: order });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=====================================UPDATE CART=====================================

const updateOrder = async (req, res) => {
  try {
    let userId = req.params.userId;
    let data = req.body;
    let { orderId, status } = data;

    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Body should not be empty" });

    if (!isValidObjectId(userId))
      return res.status(400).send({ status: false, message: "Invalid UserId" });

    const userExist = await userModel.findById(userId);

    if (!userExist)
      return res.status(404).send({ status: false, message: "No User Found" });

    if (!orderId)
      return res
        .status(400)
        .send({ status: false, message: "Provide OrderId" });

    if (!isValidObjectId(orderId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid OrderId" });

    let orderExist = await orderModel.findOne({
      _id: orderId,
      isDeleted: false,
    });

    if (!orderExist)
      return res
        .status(404)
        .send({ status: false, message: "There is no Order Exist" });

    if (!status)
      return res
        .status(400)
        .send({ status: false, message: "Status is require" });

    statusAvailable = status.replace(/\s+/g, "").split(",").map(String);

    let arr = ["completed", "cancelled"];
    let flag;
    for (let i = 0; i < statusAvailable.length; i++) {
      flag = arr.includes(statusAvailable[i]);
    }

    if (!flag)
      return res.status(400).send({
        status: false,
        message: "Enter a valid status completed or cancelled",
      });

    data["status"] = statusAvailable;

    if (orderExist.cancellable == false) {
      if (status != "completed")
        return res
          .status(400)
          .send({ status: false, message: "can't cancel the order" });
    }

    orderExist.status = status;

    let update = await orderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: orderExist },
      { new: true }
    );

    return res
      .status(200)
      .send({ status: true, message: "Success", data: update });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createOrder, updateOrder };
