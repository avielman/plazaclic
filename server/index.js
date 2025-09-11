const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increased limit

// --- DATABASE HELPERS ---
const usersDbPath = path.join(__dirname, 'users.json');
const productsDbPath = path.join(__dirname, 'products.json');
const ordersDbPath = path.join(__dirname, 'orders.json');
const inventoryMovementsDbPath = path.join(__dirname, 'inventory-movements.json');

const readData = (dbPath) => {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(dbPath);
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading data from ${dbPath}:`, error);
    return [];
  }
};

const writeData = (dbPath, data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing data to ${dbPath}:`, error);
  }
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
    if (name) {
        products = products.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
    }

    // Multi-select brand filter
    if (brand) {
        const selectedBrands = brand.split(',').map(b => b.toLowerCase());
        products = products.filter(p => selectedBrands.includes(p.brand.name.toLowerCase()));
    }

    // Multi-select category filter
    if (category) {
        // Primero, preparamos las categorías que el usuario seleccionó.
        const selectedCategories = category.split(',').map(c => c.toLowerCase());

        // Ahora, filtramos los productos de forma segura.
        products = products.filter(p => {
            // Verificamos si la propiedad 'category' existe y es un array.
            // Esto es crucial para evitar errores si no está presente o tiene otro formato.
            if (p.category && Array.isArray(p.category)) {
                // Usamos .some() para verificar si AL MENOS UNA categoría del producto
                // está incluida en las categorías seleccionadas por el usuario.
                return p.category.some(productCategory => {
                    // Verificamos que cada categoría del producto sea un string válido.
                    if (typeof productCategory === 'string') {
                        return selectedCategories.includes(productCategory.toLowerCase());
                    }
                    // Si la categoría del producto no es un string, la descartamos.
                    return false;
                });
            }
            // Si el producto no tiene un array de categorías, lo descartamos.
            return false;
        });
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
  console.log('POST /api/products received. Body:', req.body.name, req.body.imageUrl ? req.body.imageUrl.length + ' images' : 'no images');
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
  console.log('POST /api/products successful.');
});

// Update Product
app.put('/api/products/:id', (req, res) => {
  console.log('PUT /api/products/:id received. ID:', req.params.id, 'Body:', req.body.name, req.body.imageUrl ? req.body.imageUrl.length + ' images' : 'no images');
  let products = readData(productsDbPath);
  const productId = parseInt(req.params.id, 10);
  const updatedProduct = req.body;

  const index = products.findIndex(p => p.id === productId);

  if (index === -1) {
    console.error('Product not found for update:', productId);
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
  console.log('PUT /api/products/:id successful.');
});

// Delete Product
app.delete('/api/products/:id', (req, res) => {
  console.log('DELETE /api/products/:id received. ID:', req.params.id);
  let products = readData(productsDbPath);
  const productId = parseInt(req.params.id, 10);

  const initialLength = products.length;
  products = products.filter(p => p.id !== productId);

  if (products.length === initialLength) {
    console.error('Product not found for deletion:', productId);
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  writeData(productsDbPath, products);
  res.status(204).send(); // No content for successful deletion
  console.log('DELETE /api/products/:id successful.');
});

// --- ORDER ROUTES ---
app.post('/api/orders', (req, res) => {
  console.log('POST /api/orders received.', req.body.customerInfo.name);
  const orders = readData(ordersDbPath);
  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    ...req.body,
    orderDate: new Date().toISOString()
  };
  orders.push(newOrder);
  writeData(ordersDbPath, orders);
  res.status(201).json(newOrder);
  console.log('POST /api/orders successful.');
});

// --- INVENTORY MOVEMENT ROUTES ---
app.post('/api/inventory-movements', (req, res) => {
  console.log('POST /api/inventory-movements received.', req.body.productId, req.body.type, req.body.quantity);
  const movements = readData(inventoryMovementsDbPath);
  const newMovement = {
    id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
    ...req.body,
    date: new Date().toISOString()
  };
  movements.push(newMovement);
  writeData(inventoryMovementsDbPath, movements);
  res.status(201).json(newMovement);
  console.log('POST /api/inventory-movements successful.');
});

app.get('/api/inventory-movements/:productId', (req, res) => {
  console.log('GET /api/inventory-movements/:productId received. Product ID:', req.params.productId);
  const movements = readData(inventoryMovementsDbPath);
  const productId = parseInt(req.params.productId, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número' });
  }

  const productMovements = movements.filter(m => m.productId === productId);
  res.json(productMovements);
  console.log('GET /api/inventory-movements/:productId successful.');
});


app.get('/api/company/:userId', (req, res) => {
  const companies = readData(path.join(__dirname, 'company.json'));
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'El ID de usuario debe ser un número' });
  }
  const company = companies.find(c => c.userId === userId);
  if (!company) {
    return res.status(404).json({ message: 'Empresa no encontrada' });
  }
  res.json(company);
});

app.put('/api/company/:userId', (req, res) => {
  const companies = readData(path.join(__dirname, 'company.json'));
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'El ID de usuario debe ser un número' });
  }
  const index = companies.findIndex(c => c.userId === userId);
  if (index === -1) {
    return res.status(404).json({ message: 'Empresa no encontrada' });
  }
  const updatedCompany = { ...companies[index], ...req.body, userId };
  companies[index] = updatedCompany;
  writeData(path.join(__dirname, 'company.json'), companies);
  res.json(updatedCompany);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
