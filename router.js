const router = require('express').Router();
const {
    createProduct,
    createProduct2,
    upload,
    getProduct,
    getProducts,
    getProductByCategory,
    updateProduct,
    deleteProduct,
    createCategory,
    getCategory,
    getcategories,
    updateCategory,
    deleteCategory,
    createOrder,
    getOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    login
} = require("./controller.js");

router.post('/product', upload, createProduct);
router.get('/products', getProducts);
router.get('/product/:id', getProduct);
router.get('/products/:category', getProductByCategory);
router.put('/product/:id', upload, updateProduct);
router.delete('/product/:id', deleteProduct);

router.post('/category', createCategory);
router.get('/categories', getcategories);
router.get('/category/:id', getCategory);
router.put('/category/:id', updateCategory);
router.delete('/category/:id', deleteCategory);

router.post('/order', createOrder);
router.get('/orders', getOrders);
router.get('/order/:id', getOrder);
router.put('/order/:id', updateOrder);
router.delete('/order/:id', deleteOrder);

router.post('/login', login);

module.exports = router;