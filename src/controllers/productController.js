const productModel = require("../models/productModel");
const { uploadFile } = require("../aws/aws");
const {
  isValidRequestBody,
  isValid,
  isValidObjectId,
  isValidImg,
  isValidName,
  isValidTitle,
} = require("../validators/validation");

const createProducts = async (req, res) => {
  try {
    let data = req.body;
    let file = req.files;

    let {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      availableSizes,
      style,
      installments,
    } = data;

    if (!isValidRequestBody(data)) {
      return res.status(400).send({
        status: false,
        message: "Provide the Product's Data",
      });
    }

    if (!title || !isValidTitle(title)) {
      return res.status(400).send({
        status: false,
        message: "Title is a mandatory field and format should be valid",
      });
    }

    let checkTitle = await productModel.findOne({ title: title });
    if (checkTitle) {
      return res.status(400).send({
        status: false,
        message: `Product with the title '${title}' is Already Present`,
      });
    }

    if (!description || !isValid(description)) {
      return res.status(400).send({
        status: false,
        message: "Please Write Description About Product in valid format",
      });
    }

    if (!price) {
      return res
        .status(400)
        .send({ status: false, message: "Price is a mandatory field" });
    }

    if (!/^[0-9]*$/.test(price)) {
      return res
        .status(400)
        .send({ status: false, message: "Price should be in Number" });
    }

    if (currencyId && currencyId != "INR") {
      return res.status(400).send({
        status: false,
        message: "Only 'INR' CurrencyId is allowed",
      });
    }

    if (currencyFormat && currencyFormat != "₹") {
      return res.status(400).send({
        status: false,
        message: "Only '₹' Currency Symbol is allowed",
      });
    }

    if (isFreeShipping != null) {
      if (
        !(
          isFreeShipping.toLowerCase() === "true" ||
          isFreeShipping.toLowerCase() === "false"
        )
      ) {
        return res.status(400).send({
          status: false,
          message: "Please Provide only Boolean Value",
        });
      }
      data["isFreeShipping"] = isFreeShipping.toLowerCase();
    }

    if (file && file.length > 0) {
      if (!isValidImg(file[0].originalname)) {
        return res.status(400).send({
          status: false,
          message: "Image Should be of JPEG/ JPG/ PNG/ JFIF/ GIF",
        });
      }

      let url = await uploadFile(file[0]);
      data["productImage"] = url;
    } else {
      return res
        .status(400)
        .send({ status: false, message: "ProductImage is a mandatory field" });
    }

    if (!availableSizes) {
      return res
        .status(400)
        .send({ status: false, message: "Size is a mandatory filed" });
    }

    let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"]; //"X,S,S,L" => [X,S,L]
    let sizeArr = availableSizes.replace(/\s+/g, "").split(",").map(String);
    let uniqueSize = sizeArr.filter(function (item, i, ar) {
      return ar.indexOf(item) === i;
    });

    for (let i = 0; i < uniqueSize.length; i++) {
      if (!arr.includes(uniqueSize[i]))
        return res.status(400).send({
          status: false,
          data: "Enter a Valid Size, Like 'XS or S or M or X or L or XL or XXL'",
        });
    }
    data["availableSizes"] = uniqueSize;

    if (installments) {
      if (!/^[0-9]*$/.test(installments)) {
        return res.status(400).send({
          status: false,
          message: "Installments value Should be only number",
        });
      }
    }

    if (style != null) {
      if (!isValid(style)) {
        return res
          .status(400)
          .send({ status: false, message: "Provide the valid style " });
      }
    }

    const createdProduct = await productModel.create(data);
    return res.status(201).send({
      status: true,
      message: "Success",
      data: createdProduct,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
//====================================get product============================================
const getProducts = async function (req, res) {
  try {
    let data = req.query;
    let { size, name, priceLessThan, priceGreaterThan, priceSort } = data;

    let ndata = {};

    if (priceSort) {
      if (priceSort != 1 && priceSort != -1)
        return res.status(400).send({
          status: false,
          data: "For ascending 1 or for descending put -1",
        });
    }

    if (size) {
      let sizeArr = size.replace(/\s+/g, "").split(",");
      var uniqueSize = sizeArr.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      });

      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];

      for (let i = 0; i < uniqueSize.length; i++) {
        if (!arr.includes(uniqueSize[i]))
          return res.status(400).send({
            status: false,
            data: "Enter a Valid Size, Like 'XS or S or M or X or L or XL or XXL'",
          });
      }
      ndata.availableSizes = { $in: sizeArr };
    }
    if (name) {
      ndata.title = { $regex: name, $options: "i" };
    }

    if (priceLessThan) {
      ndata.price = { $lt: Number(priceLessThan) };
    }

    if (priceGreaterThan) {
      ndata.price = { $gt: Number(priceGreaterThan) };
    }

    let productDetail = await productModel
      .find({ isDeleted: false, ...ndata })
      .sort({ price: parseInt(priceSort) });
    if (productDetail.length == 0)
      return res
        .status(404)
        .send({ status: false, message: "No product found" });

    return res
      .status(200)
      .send({ status: true, message: "Success", data: productDetail });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=====================================GET PRODUCT========================================

const getByID = async function (req, res) {
  try {
    const productID = req.params.productId;
    if (!isValidObjectId(productID))
      return res.status(400).send({
        status: false,
        message: "Please enter valid PRODUCT Id in params",
      });
    const checkData = await productModel.findOne({
      _id: productID,
      isDeleted: false,
    });
    if (!checkData)
      return res
        .status(400)
        .send({ status: false, message: "Product not found" });
    return res
      .status(200)
      .send({ status: true, message: "Success", data: checkData });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=====================================UPDATE PRODUCT========================================

const updateProducts = async (req, res) => {
  try {
    let productId = req.params.productId;
    let data = req.body;
    let file = req.files;

    let {
      title,
      description,
      currencyId,
      currencyFormat,
      availableSizes,
      price,
      isFreeShipping,
      style,
      installments,
    } = data;

    if (!isValidObjectId(productId))
      return res.status(400).send({
        status: false,
        message: "Please enter valid PRODUCT Id in params",
      });

    let findProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });

    if (!findProduct)
      return res.status(400).send({
        status: false,
        message: "Product not found",
      });

    let updateProduct = {};

    if (title) {
      if (!isValidName(title))
        return res
          .status(400)
          .send({ status: false, message: "Title is invalid" });

      let checkTitle = await productModel.findOne({ title: title });
      if (checkTitle)
        return res.status(400).send({
          status: false,
          message: `Product with title '${title}' is Already Present`,
        });
      updateProduct["title"] = title;
    }

    if (description) {
      if (!isValid(description))
        return res.status(400).send({
          status: false,
          message: "Please Write Description About Product ",
        });
      updateProduct["description"] = description;
    }

    if (price) {
      if (!/^[0-9]*$/.test(price))
        return res
          .status(400)
          .send({ status: false, message: "Price should be in Number" });
      updateProduct["price"] = price;
    }

    if (currencyId) {
      return res.status(400).send({
        status: false,
        message: "You cannot change currencyId, By default it is set to INR",
      });
    }

    if (currencyFormat) {
      return res.status(400).send({
        status: false,
        message: "You cannot change currencyFormat, By default it is set to ₹",
      });
    }

    if (isFreeShipping) {
      if (
        !(
          isFreeShipping.toLowerCase() === "true" ||
          isFreeShipping.toLowerCase() === "false"
        )
      ) {
        return res.status(400).send({
          status: false,
          message: "Please Provide only Boolean Value",
        });
      }
      updateProduct["isFreeShipping"] = isFreeShipping.toLowerCase();
    }

    if (file && file.length > 0) {
      if (!isValidImg(file[0].originalname)) {
        return res.status(400).send({
          status: false,
          message: "Image Should be of JPEG/ JPG/ PNG /GIF/GFIF",
        });
      }
      let url = await uploadFile(file[0]);
      updateProduct["productImage"] = url;
    }

    if (availableSizes) {
      let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
      let oldSizes = findProduct.availableSizes;
      let sizeArr = availableSizes.replace(/\s+/g, "").split(",").map(String);
      sizeArr = sizeArr.concat(oldSizes);

      let uniqueSize = sizeArr.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      });

      for (let i = 0; i < uniqueSize.length; i++) {
        if (!arr.includes(uniqueSize[i]))
          return res.status(400).send({
            status: false,
            data: "Enter a Valid Size, Like 'XS or S or M or X or L or XL or XXL'",
          });
      }
      updateProduct["availableSizes"] = uniqueSize;
    }

    if (installments) {
      if (!/^[0-9]*$/.test(installments)) {
        return res.status(400).send({
          status: false,
          message: "Installments value Should be only number",
        });
      }
      if (installments <= 0) {
        return res.status(400).send({
          status: false,
          message: "installments Shoud be In Valid  Number only",
        });
      }
      updateProduct["installments"] = installments;
    }

    if (style) {
      if (!isValid(style))
        return res
          .status(400)
          .send({ status: false, message: "Provide style in valid format" });
      updateProduct["style"] = style;
    }

    if (Object.keys(updateProduct).length == 0)
      return res.status(400).send({
        status: false,
        message: "please give some data to update",
      });

    const updatedProduct = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      updateProduct,
      {
        new: true,
      }
    );

    return res.status(200).send({
      status: true,
      message: "Success",
      data: updatedProduct,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

//=====================================delete product = =========================================

const deleteProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!isValidObjectId(productId))
      return res.status(400).send({
        status: false,
        message: "Please enter valid PRODUCT Id in params",
      });

    const findProduct = await productModel.findById(productId);
    if (!findProduct) {
      return res
        .status(400)
        .send({ status: false, message: `Product not found` });
    }

    if (findProduct.isDeleted == true) {
      return res
        .status(400)
        .send({ status: false, message: `Product has been already deleted` });
    }

    const deletedProduct = await productModel.findOneAndUpdate(
      { _id: productId },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );

    return res.status(200).send({
      status: true,
      message: `Success`,
      data: deletedProduct,
    });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

module.exports = {
  createProducts,
  getProducts,
  updateProducts,
  getByID,
  deleteProductById,
};
