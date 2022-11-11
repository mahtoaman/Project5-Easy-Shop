const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const {
  isValidObjectId,
  isValidRequestBody,
} = require("../validators/validation");

//============================CREATE CART===================================

const createCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    let data = req.body;
    let { quantity, productId } = data;
    let cartId = req.body.cartId;

    if (!isValidRequestBody(data))
      return res.status(400).send({
        status: false,
        message: "Please provide all the required data",
      });

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Not a valid productId" });

    const product = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!product)
      return res
        .status(404)
        .send({ status: false, message: "Product not found" });

    if (!cartId) {
      let checking = await cartModel.findOne({ userId: userId });
      if (checking) {
        return res.status(409).send({
          status: false,
          message: "User already has a cart, please enter cartId",
        });
      }
    }

    let cartAvaiable = await cartModel.findOne({ userId: userId });

    if (cartId) {
      if (!isValidObjectId(cartId))
        return res
          .status(400)
          .send({ status: false, message: "Invalid cartId" });

      if (cartAvaiable._id.toString() != cartId)
        return res.status(400).send({
          status: false,
          message: "cartId is not correct for the given user",
        });
    }

    if (cartAvaiable) {
      if (!quantity) quantity = 1;
      let items = cartAvaiable.items;

      let flag = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].productId.toString() == productId) {
          items[i].quantity += quantity - 0;
          flag = true;
        }
      }
      if (!flag) {
        let itemArray = { productId: productId, quantity: quantity };
        items.push(itemArray);
      }

      let updateData = {
        userId: userId,
        items: items,
        totalPrice: (cartAvaiable.totalPrice += product.price * quantity),
        totalItems: items.length,
      };
      let cart = await cartModel.findOneAndUpdate(
        { userId: userId },
        { $set: updateData },
        { new: true }
      );

      let fetchedData = await cartModel.findById(cart._id).populate({
        path: "items",
        populate: {
          path: "productId",
          select: ["title", "price", "productImage"],
        },
      });

      return res
        .status(201)
        .send({ status: true, message: "Success", data: fetchedData });
    }

    if (!cartAvaiable) {
      let pPrice = product.price;
      if (!quantity) quantity = 1;

      let itemArray = [{ productId: productId, quantity: quantity }];
      var finalCart = {
        userId: userId,
        items: itemArray,
        totalPrice: pPrice * quantity,
        totalItems: 1,
      };
    }
    let createCart = await cartModel.create(finalCart);
    let fetchedData = await cartModel.findById(createCart._id).populate({
      path: "items",
      populate: {
        path: "productId",
        select: ["title", "price", "productImage"],
      },
    });

    return res.status(201).send({
      status: true,
      message: "Success",
      data: fetchedData,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
//create cart tested
//==================================UPDATE CART===============================================

const updateCart = async (req, res) => {
  try {
    let data = req.body;
    let { cartId, productId, removeProduct } = data;

    if (!isValidRequestBody(data))
      return res
        .status(400)
        .send({ status: false, message: "Provide the data" });

    if (!productId)
      return res
        .status(400)
        .send({ status: false, message: "Provide the ProductId" });

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: "Invalid ProductId" });

    let product = await productModel.findById(productId);
    if (!product)
      return res.status(404).send({
        status: false,
        message: `No Product Found With this ${productId}`,
      });

    if (!(removeProduct || removeProduct == 0))
      return res
        .status(400)
        .send({ status: false, message: "Provide the removeProduct Key" });

    if (!(removeProduct == 1 || removeProduct == 0))
      return res.status(400).send({
        status: false,
        message:
          "RemoveProduct Key value Should be less than quantity and can't accept letters",
      });

    if (!cartId)
      return res
        .status(400)
        .send({ status: false, message: "Provide the cartId" });

    if (!isValidObjectId(cartId))
      return res.status(400).send({ status: false, message: "Invalid CartId" });

    let cartExist = await cartModel.findById(cartId);

    if (!cartExist)
      return res.status(400).send({ status: false, message: "cart not found" });

    if (cartExist.items.length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "There is No Item in This Cart" });
    }

    let flag = false;
    let items = cartExist.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].productId == productId) {
        if (removeProduct == 1) {
          items[i].quantity -= 1;
          cartExist.totalPrice -= product.price;
          if (items[i].quantity == 0) {
            items.splice(i, 1);
          }
        } else if (removeProduct == 0) {
          cartExist.totalPrice =
            cartExist.totalPrice - items[i].quantity * product.price;
          items.splice(i, 1);
        }
        flag = true;

        cartExist.totalItems = items.length;

        let result = await cartModel.findOneAndUpdate(
          { _id: cartId },
          { $set: cartExist },
          { new: true }
        );

        let fetchedData = await cartModel.findById(result._id).populate({
          path: "items",
          populate: {
            path: "productId",
            select: ["title", "price", "productImage"],
          },
        });

        return res.status(200).send({
          status: true,
          message: "Success",
          data: fetchedData,
        });
      }
    }
    if (flag == false) {
      return res.status(404).send({
        status: false,
        message: `Product not found`,
      });
    }
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//============================GET CART==============================================

const getCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    const checkData = await cartModel.findOne({ userId });

    if (!checkData)
      return res
        .status(400)
        .send({ status: false, message: "Cart not found of this USER" });

    if (checkData.items.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "Cart empty", data: checkData });

    let fetchedData = await cartModel.findById(checkData._id).populate({
      path: "items",
      populate: {
        path: "productId",
        select: ["title", "price", "productImage"],
      },
    });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: fetchedData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=============================DELETE CART============================================================

const deleteCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    const checkData = await cartModel.findOne({ userId: userId });

    if (!checkData)
      return res
        .status(400)
        .send({ status: false, message: "Cart not found of this USER" });

    if (checkData.items.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "Item already Deleted" });

    const deleteCart = await cartModel.findOneAndUpdate(
      { _id: checkData._id },
      { items: [], totalPrice: 0, totalItems: 0 },
      { new: true }
    );
    return res.status(204).send({
      status: true,
      message: "Success",
      data: deleteCart,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = { createCart, getCart, deleteCart, updateCart };
