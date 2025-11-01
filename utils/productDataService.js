const fs = require("fs");

const DATA_FILE = "./database/products.json";

function readProductData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }

    const content = fs.readFileSync(DATA_FILE, "utf-8").trim();

    if (!content) {
        return []; // return empty array if file is empty
    }

    try {
        return JSON.parse(content);
    } catch (err) {
        console.error("❌ JSON parse error:", err.message);
        return []; // fallback instead of crashing
    }
}
// Write JSON data
function writeProductData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Export functions
module.exports = { readProductData, writeProductData };