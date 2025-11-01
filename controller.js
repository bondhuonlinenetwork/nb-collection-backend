// const User = require('./schema/user');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// === Setup paths ===
const dataFilePath = path.join(process.cwd(), 'database', 'products.json');
const publicDir = path.join(process.cwd(), 'public', 'uploads');
const categoryFilePath = path.join(process.cwd(), 'database', 'category.json'); // adjust if needed
const orderFilePath = path.join(process.cwd(), 'database', 'order.json'); // adjust if needed

// === Ensure upload directory exists ===
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// === Multer config ===
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, publicDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage }).any();

// === Helper functions ===
const readProductData = () => {
    if (!fs.existsSync(dataFilePath)) return [];
    const data = fs.readFileSync(dataFilePath, "utf8");
    return data ? JSON.parse(data) : [];
};
const writeProductData = (data) => fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));

const readCategoryData = () => {
    if (!fs.existsSync(categoryFilePath)) return [];
    const data = fs.readFileSync(categoryFilePath, "utf8");
    return data ? JSON.parse(data) : [];
};
const writeCategoryData = (data) => fs.writeFileSync(categoryFilePath, JSON.stringify(data, null, 2));
const readOrderData = () => {
    if (!fs.existsSync(orderFilePath)) return [];
    const data = fs.readFileSync(orderFilePath, "utf8");
    return data ? JSON.parse(data) : [];
};
const writeOrderData = (data) => fs.writeFileSync(orderFilePath, JSON.stringify(data, null, 2));

const createProduct = async (req, res) => {
    try {
        const products = readProductData();

        const imagePaths = req.files.map((f) => `/uploads/${f.filename}`);
        const sizes = JSON.parse(req.body.sizes || "[]");

        const newProduct = {
            id: Date.now(),
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            creation_date: new Date().toISOString(),
            images: imagePaths,
            sizes,
        };

        products.push(newProduct);
        writeProductData(products);

        res.json({ message: "Product added successfully", product: newProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add product" });
    }
}
const createProduct2 = async (req, res) => {
    try {
        const data = readProductData();
        const { name, price, description, category } = req.body;

        // Rebuild variants with images
        const variants = (req.body.variants || []).map((variant, index) => ({
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            images: (req.files || [])
                .filter(f => f.fieldname === `variants[${index}][images][]`)
                .map(f => `/uploads/${f.filename}`),
        }));

        const newProduct = {
            id: Date.now(),
            name,
            price,
            creation_date: new Date().toISOString(),
            description,
            category,
            variants,
        };

        data.push(newProduct);
        writeProductData(data);

        res.status(201).json({ message: 'Product created successfully', product: newProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};
const getProducts = async (req, res) => {
    const data = readProductData();
    res.json(data);
}
const getProductByCategory = async (req, res) => {
    const data = readProductData();
    const { category } = req.params;
    const filtered = data.filter((product) => product.category == category);
    res.json(filtered);
}
const getProduct = async (req, res) => {
    const data = readProductData();
    const user = data.find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
}
const updateProduct = async (req, res) => {
    try {
        const data = readProductData();
        const productIndex = data.findIndex((p) => p.id == req.params.id);
        if (productIndex === -1) return res.status(404).json({ error: "Product not found" });

        const product = data[productIndex];

        // Update base fields
        product.name = req.body.name;
        product.price = req.body.price;
        product.description = req.body.description;
        product.category = req.body.category;
        product.sizes = JSON.parse(req.body.sizes || "[]");

        // Handle images
        const existingImages = Array.isArray(req.body.images)
            ? req.body.images
            : req.body.images
                ? [req.body.images]
                : [];

        const newImages = (req.files || []).map((f) => `/uploads/${f.filename}`);
        product.images = [...existingImages, ...newImages];

        data[productIndex] = product;
        writeProductData(data);

        res.json({ message: "Product updated successfully", product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update product" });
    }
};
const updateProduct2 = async (req, res) => {
    try {
        const data = readProductData();

        const productIndex = data.findIndex(p => p.id == req.params.id);
        if (productIndex === -1) return res.status(404).json({ error: "Product not found" });

        const product = data[productIndex];

        // Update main fields
        product.name = req.body.name;
        product.price = req.body.price;
        product.description = req.body.description;
        product.category = req.body.category;

        // Update variants
        const variants = req.body.variants || [];
        product.variants = variants.map((v, i) => {
            // Ensure images array
            let existingImages = [];
            if (v.images) {
                if (Array.isArray(v.images)) existingImages = v.images;
                else existingImages = [v.images]; // single string
            }

            // New uploaded files
            const newImages = (req.files || [])
                .filter(f => f.fieldname.startsWith(`variants[${i}][images]`))
                .map(f => `/uploads/${f.filename}`);

            return {
                size: v.size,
                color: v.color,
                stock: v.stock,
                images: [...existingImages, ...newImages],
            };
        });

        data[productIndex] = product;
        writeProductData(data);

        res.json({ message: "Product updated", product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update product" });
    }
};
const deleteProduct = async (req, res) => {
    try {
        const products = readProductData();
        const productId = parseInt(req.params.id);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const product = products[productIndex];

        // Delete product images from uploads folder
        if (product.images && product.images.length > 0) {
            for (const imgPath of product.images) {
                try {
                    // image URL might be like: http://localhost:5000/uploads/123.jpg OR /uploads/123.jpg
                    const filename = imgPath.split('/').pop();
                    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        // console.log(`🗑️ Deleted image: ${filename}`);
                    }
                } catch (err) {
                    console.warn('⚠️ Error deleting image:', err.message);
                }
            }
        }

        // Remove product from JSON data
        const updatedProducts = products.filter(p => p.id !== productId);
        writeProductData(updatedProducts);

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ message: 'Failed to delete product' });
    }
}

const createCategory = async (req, res) => {
    console.log(req.body)
    const data = readCategoryData();
    const newUser = { id: Date.now(), ...req.body };
    data.push(newUser);
    writeCategoryData(data);
    res.status(201).json(newUser);
}
const getcategories = async (req, res) => {
    const data = readCategoryData();
    res.json(data);
}
const getCategory = async (req, res) => {
    const data = readCategoryData();
    const category = data.find(u => u.id == req.params.id);
    if (!category) return res.status(404).json({ message: "category not found" });
    res.json(category);
}
const updateCategory = async (req, res) => {
    const data = readCategoryData();
    const index = data.findIndex(u => u.id == req.params.id);
    if (index === -1) return res.status(404).json({ message: "User not found" });

    data[index] = { ...data[index], ...req.body };
    writeCategoryData(data);
    res.json(data[index]);
}
const deleteCategory = async (req, res) => {
    const data = readCategoryData();
    const filtered = data.filter(u => u.id != req.params.id);

    if (data.length === filtered.length) {
        return res.status(404).json({ message: "User not found" });
    }

    writeCategoryData(filtered);
    res.json({ message: "User deleted" });
}
const createOrder = async (req, res) => {
    const {
        phone,
        name,
        address,
        city,
        postalCode,
        paymentType,
        paymentMethod,
        transactionId,
        products
    } = req.body;
    const errors = [];

    // === VALIDATIONS ===

    if (!phone) {
        errors.push({ field: "phone", message: "Phone number is required." });
    } else if (!/^01[3-9]\d{8}$/.test(phone)) {
        errors.push({ field: "phone", message: "Invalid Bangladeshi phone number." });
    }
    // 2️⃣ First name
    if (!name || name.trim().length < 2) {
        errors.push({
            field: "firstName",
            message: "First name must be at least 2 characters long.",
        });
    }

    // 3️⃣ Address
    if (!address || address.trim().length < 5) {
        errors.push({
            field: "address",
            message: "Address must be at least 5 characters long.",
        });
    }

    // 4️⃣ City
    if (!city || city.trim().length < 2) {
        errors.push({ field: "city", message: "City is required." });
    }

    // 5️⃣ Postal Code (optional)
    if (postalCode && !/^\d{4,6}$/.test(postalCode)) {
        errors.push({
            field: "postalCode",
            message: "Postal code must be 4–6 digits.",
        });
    }

    // 6️⃣ Payment method
    //   const allowedPayments = ["Cash on delivery", "Bkash", "Nagad"];
    //   if (!paymentMethod || !allowedPayments.includes(paymentMethod)) {
    //     errors.push("Invalid payment method.");
    //   }

    // 7️⃣ Transaction ID (required for Bkash/Nagad)
    if (!transactionId) {
        console.log('here');
        errors.push({
            field: "transactionId",
            message: "Transaction ID is required for online payments.",
        });
    }

    // === RETURN VALIDATION RESULT ===
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors,
        });
    }
    // products presence check
    if (!products || !Array.isArray(products) || products.length === 0) {
        errors.push({ field: "products", message: "At least one product must be included." });
    } else {
        const allProducts = readProductData();

        products.forEach((p, index) => {
            const requestedQty = Number(p.quantity || 0);
            const sizeName = p.size ?? "";

            const dbProduct = allProducts.find((item) => String(item.id) === String(p.id));
            if (!dbProduct) {
                errors.push({
                    field: `products[${index}]`,
                    message: `Product with ID ${p.id} not found.`,
                });
                return;
            }

            // validate quantity
            if (!requestedQty || requestedQty <= 0) {
                errors.push({
                    field: `products[${index}]`,
                    message: `Invalid quantity for '${dbProduct.name}'.`,
                });
                return;
            }

            // sizes must exist in your structure; attempt to find requested size
            const sizes = Array.isArray(dbProduct.sizes) ? dbProduct.sizes : [];
            // try exact match first
            let sizeObj = sizes.find((s) => String(s.name) === String(sizeName));

            // if not found and there is exactly one size entry, we assume that is the one (useful if size is '')
            if (!sizeObj && sizes.length === 1) {
                sizeObj = sizes[0];
            }

            if (!sizeObj) {
                errors.push({
                    field: `products[${index}]`,
                    message: `Size '${sizeName}' not found for product '${dbProduct.name}'.`,
                });
                return;
            }

            const currentStock = Number(sizeObj.stock || 0);
            if (requestedQty > currentStock) {
                errors.push({
                    field: `products[${index}]`,
                    message: `Product '${dbProduct.name}' (size: '${sizeObj.name || "default"}') only has ${currentStock} in stock (requested ${requestedQty}).`,
                });
            }
        });
    }

    if (errors.length > 0) {
        console.log('Validation errors:', errors);
        return res.status(400).json({ success: false, errors });
    }

    // --- All checks passed: now reduce stock and persist ---
    // Read again to ensure fresh copy
    const productData = readProductData();
    // keep a deep copy for rollback if needed
    const backup = JSON.parse(JSON.stringify(productData));

    try {
        products.forEach((orderItem) => {
            const requestedQty = Number(orderItem.quantity || 0);
            const sizeName = orderItem.size ?? "";
            const product = productData.find((p) => String(p.id) === String(orderItem.id));
            if (!product) return; // should not happen because validated above

            let sizeObj = Array.isArray(product.sizes) ? product.sizes.find(s => String(s.name) === String(sizeName)) : undefined;
            if (!sizeObj && Array.isArray(product.sizes) && product.sizes.length === 1) {
                sizeObj = product.sizes[0];
            }

            if (sizeObj) {
                const newStock = Math.max(0, Number(sizeObj.stock || 0) - requestedQty);
                // keep same type as original (your JSON used strings), so store as string
                sizeObj.stock = String(newStock);
            } else {
                // fallback: if no sizes array, attempt top-level stock (if you later add it)
                if (product.stock !== undefined) {
                    product.stock = String(Math.max(0, Number(product.stock || 0) - requestedQty));
                }
            }
        });

        // write atomically
        writeProductData(productData);
    } catch (writeErr) {
        // rollback to backup on any write/mutation error
        try {
            writeProductData(backup);
        } catch (rollbackErr) {
            console.error("CRITICAL: failed rollback after write error", rollbackErr);
        }
        console.error("Error while reducing stock:", writeErr);
        return res.status(500).json({ success: false, message: "Failed to update product stock." });
    }

    // === Save Order ===
    const data = readOrderData();
    const newOrder = { id: Date.now(), ...req.body };
    data.push(newOrder);
    writeOrderData(data);
    res.status(201).json(newOrder);
}
const getOrders = async (req, res) => {
    const data = readOrderData();
    res.json(data);
}
const getOrder = async (req, res) => {
    const data = readOrderData();
    const order = data.find(u => u.id == req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
}
const updateOrder = async (req, res) => {
    const data = readOrderData();
    const index = data.findIndex(u => u.id == req.params.id);
    if (index === -1) return res.status(404).json({ message: "Order not found" });
    data[index] = req.body;
    writeOrderData(data);
    res.json(data[index]);
}
const deleteOrder = async (req, res) => {
    const data = readOrderData();
    const filtered = data.filter(u => u.id != req.params.id);

    if (data.length === filtered.length) {
        return res.status(404).json({ message: "Order not found" });
    }

    writeOrderData(filtered);
    res.json({ message: "Order deleted" });
}

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ message: "Username required." });
    if (!password) return res.status(400).json({ message: "Password required." });
    if (username != process.env.ADMIN_USERNAME) return res.status(400).json({ message: "Invalid credentials." })
    if (password != process.env.ADMIN_PASSWORD) return res.status(400).json({ message: "Invalid credentials." })
    // const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD);
    // if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ username: username }, "3q8%UUz309;C", { expiresIn: "30d" });
    res.json({ token });
}
module.exports = {
    createProduct,
    createProduct2,
    upload,
    getProduct,
    getProducts,
    getProductByCategory,
    updateProduct,
    updateProduct2,
    deleteProduct,
    createCategory,
    getcategories,
    getCategory,
    updateCategory,
    deleteCategory,
    createOrder,
    getOrders,
    getOrder,
    updateOrder,
    deleteOrder,
    login
};