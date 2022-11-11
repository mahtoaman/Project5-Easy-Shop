const mongoose = require("mongoose")
let ObjectId = mongoose.Schema.Types.ObjectId

let cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    items: [{
        _id: 0,
        productId: {
            type: ObjectId,
            ref: "product",
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
        comment: "Holds total price of all the items in the cart"
    },
    totalItems: {
        type: Number,
        required: true,
        comment: "Holds total number of items in the cart"
    }
}, { timestamps: true })


module.exports = mongoose.model('carts', cartSchema)