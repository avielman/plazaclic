const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE HELPERS ---
const usersDbPath = path.join(__dirname, 'users.json');
const productsDbPath = path.join(__dirname, 'products.json');
const ordersDbPath = path.join(__dirname, 'orders.json');
const inventoryMovementsDbPath = path.join(__dirname, 'inventory-movements.json');

const readData = (dbPath) => {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }
  const data = fs.readFileSync(dbPath);
  return JSON.parse(data);
};

const writeData = (dbPath, data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

// Helper to record inventory movement
const recordInventoryMovement = (productId, type, quantity, userId, notes = '') => {
  const movements = readData(inventoryMovementsDbPath);
  const newMovement = {
    id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
    productId,
    type,
    quantity,
    date: new Date().toISOString(),
    userId,
    notes
  };
  movements.push(newMovement);
  writeData(inventoryMovementsDbPath, movements);
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', (req, res) => {
  const users = readData(usersDbPath);
  const { email, password, userType } = req.body;

  if (!email || !password || !userType) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    email,
    password, // In a real app, hash this!
    userType
  };

  users.push(newUser);
  writeData(usersDbPath, users);

  res.status(201).json({ message: 'Usuario registrado con éxito', user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const users = readData(usersDbPath);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' });
  }

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  res.json({ 
    message: 'Login exitoso', 
    user: { id: user.id, email: user.email, userType: user.userType }
  });
});

// --- PRODUCT ROUTES ---
app.get('/api/products', (req, res) => {
    let products = readData(productsDbPath);

    // Filtering
    const { minPrice, maxPrice, brand, category, name } = req.query;

    if (minPrice) {
        products = products.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
        products = products.filter(p => p.price <= parseFloat(maxPrice));
    }
    if (brand) {
        products = products.filter(p => p.brand.name.toLowerCase().includes(brand.toLowerCase()));
    }
    if (category) {
        products = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
    }
    if (name) {
        products = products.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
    }

    // Sorting
    const { sortBy, sortOrder } = req.query;
    if (sortBy) {
        products.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    res.json(products);
});

app.get('/api/my-products/:ownerId', (req, res) => {
    const products = readData(productsDbPath);
    const ownerId = parseInt(req.params.ownerId, 10);

    if (isNaN(ownerId)) {
        return res.status(400).json({ message: 'El ID del propietario debe ser un número' });
    }

    const userProducts = products.filter(p => p.ownerId === ownerId);
    res.json(userProducts);
});

// Add Product
app.post('/api/products', (req, res) => {
  const products = readData(productsDbPath);
  const newProduct = { 
    id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
    ...req.body
  };
  products.push(newProduct);
  writeData(productsDbPath, products);

  // Record initial inventory entry
  if (newProduct.quantity > 0 && newProduct.ownerId) {
    recordInventoryMovement(newProduct.id, 'entry', newProduct.quantity, newProduct.ownerId, 'Initial stock');
  }

  res.status(201).json(newProduct);
});

// Update Product
app.put('/api/products/:id', (req, res) => {
  let products = readData(productsDbPath);
  const productId = parseInt(req.params.id, 10);
  const updatedProduct = req.body;

  const index = products.findIndex(p => p.id === productId);

  if (index === -1) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  const oldQuantity = products[index].quantity;
  const newQuantity = updatedProduct.quantity;

  products[index] = { ...products[index], ...updatedProduct, id: productId }; // Ensure ID is not changed
  writeData(productsDbPath, products);

  // Record inventory movement if quantity changed
  if (newQuantity !== oldQuantity && updatedProduct.ownerId) {
    const quantityDiff = newQuantity - oldQuantity;
    if (quantityDiff > 0) {
      recordInventoryMovement(productId, 'entry', quantityDiff, updatedProduct.ownerId, 'Stock update');
    } else if (quantityDiff < 0) {
      recordInventoryMovement(productId, 'exit', Math.abs(quantityDiff), updatedProduct.ownerId, 'Stock update');
    }
  }

  res.json(products[index]);
});

// Delete Product
app.delete('/api/products/:id', (req, res) => {
  let products = readData(productsDbPath);
  const productId = parseInt(req.params.id, 10);

  const initialLength = products.length;
  products = products.filter(p => p.id !== productId);

  if (products.length === initialLength) {
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  writeData(productsDbPath, products);
  res.status(204).send(); // No content for successful deletion
});

// --- ORDER ROUTES ---
app.post('/api/orders', (req, res) => {
  const orders = readData(ordersDbPath);
  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    ...req.body,
    orderDate: new Date().toISOString()
  };
  orders.push(newOrder);
  writeData(ordersDbPath, orders);
  res.status(201).json(newOrder);
});

// --- INVENTORY MOVEMENT ROUTES ---
app.post('/api/inventory-movements', (req, res) => {
  const movements = readData(inventoryMovementsDbPath);
  const newMovement = {
    id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
    ...req.body,
    date: new Date().toISOString()
  };
  movements.push(newMovement);
  writeData(inventoryMovementsDbPath, movements);
  res.status(201).json(newMovement);
});

app.get('/api/inventory-movements/:productId', (req, res) => {
  const movements = readData(inventoryMovementsDbPath);
  const productId = parseInt(req.params.productId, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número' });
  }

  const productMovements = movements.filter(m => m.productId === productId);
  res.json(productMovements);
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});