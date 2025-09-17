
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Increased limit
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- DATABASE HELPERS ---
const usersDbPath = path.join(__dirname, 'users.json');
const productsDbPath = path.join(__dirname, 'products.json');
const ordersDbPath = path.join(__dirname, 'orders.json');
const inventoryMovementsDbPath = path.join(__dirname, 'inventory-movements.json');
const brandDbPath = path.join(__dirname, 'brands.json');
const categoryDbPath = path.join(__dirname, 'categories.json');

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
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(dbPath, jsonString, 'utf8');
    console.log(`[SUCCESS] Wrote ${data.length} items to ${path.basename(dbPath)}`);
    logToFile(`Éxito: Escribió ${data.length} items a ${path.basename(dbPath)}`);
  } catch (error) {
    console.error(`[ERROR] Failed to write to ${dbPath}:`, error.message);
    console.error('Data length:', data.length);
    console.error('Sample data:', JSON.stringify(data.slice(0, 2), null, 2));
    logToFile(`Error al escribir a ${path.basename(dbPath)}: ${error.message}`, true);
  }
};

// Logging helper function
const logToFile = (message, isError = false) => {
  const logPath = path.join(__dirname, 'registro.log');
  const timestamp = new Date().toISOString();
  const level = isError ? 'ERROR' : 'INFO';
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  try {
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (error) {
    console.error('Failed to write to registro.log:', error);
  }
};

// Helper to record inventory movement
const recordInventoryMovement = (productId, type, quantity, userId, notes = '', value = null) => {
  const movements = readData(inventoryMovementsDbPath);
  const newMovement = {
    id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
    productId,
    type,
    quantity,
    ...(type === 'entry' && value !== null ? { value } : {}),
    date: new Date().toISOString(),
    userId,
    notes
  };
  movements.push(newMovement);
  writeData(inventoryMovementsDbPath, movements);
};



// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/brands'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

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
    let products = readData(productsDbPath);
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

// Get single product by ID
app.get('/api/products/:id', (req, res) => {
console.log('GET /api/products/:id received. ID:', req.params.id);
const products = readData(productsDbPath);
const productId = parseInt(req.params.id, 10);

if (isNaN(productId)) {
  return res.status(400).json({ message: 'El ID del producto debe ser un número válido' });
}

const product = products.find(p => p.id === productId);
if (!product) {
  console.error('Product not found:', productId);
  return res.status(404).json({ message: 'Producto no encontrado' });
}

res.json(product);
console.log('GET /api/products/:id successful.');
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

  // Record movements
  if (newOrder.items && Array.isArray(newOrder.items)) {
    newOrder.items.forEach(item => {
      // Record inventory movement
      recordInventoryMovement(item.productId, 'exit', item.quantity, newOrder.customerInfo.userId || 0, 'Order');
    });
  }

  orders.push(newOrder);
  writeData(ordersDbPath, orders);
  res.status(201).json(newOrder);
  console.log('POST /api/orders successful.');
});

// --- INVENTORY MOVEMENT ROUTES ---
app.post('/api/inventory-movements', (req, res) => {
  console.log('POST /api/inventory-movements received.', req.body.productId, req.body.type, req.body.quantity);

  // Parse and validate inputs
  const productId = parseInt(req.body.productId, 10);
  const quantity = parseFloat(req.body.quantity);
  const type = req.body.type;
  const value = type === 'entry' ? parseFloat(req.body.value) : null;

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'El ID del producto debe ser un número válido' });
  }
  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un número positivo válido' });
  }
  if (type !== 'entry' && type !== 'exit') {
    return res.status(400).json({ message: 'El tipo debe ser "entry" o "exit"' });
  }
  if (type === 'entry' && (isNaN(value) || value < 0)) {
    return res.status(400).json({ message: 'Para entradas, el valor (costo) debe ser un número válido >= 0' });
  }

  const movements = readData(inventoryMovementsDbPath);
  const newMovement = {
    id: movements.length > 0 ? Math.max(...movements.map(m => m.id)) + 1 : 1,
    productId,
    type,
    quantity,
    ...(type === 'entry' ? { value } : {}),
    date: new Date().toISOString(),
    userId: req.body.userId,
    notes: req.body.notes || ''
  };
  movements.push(newMovement);
  writeData(inventoryMovementsDbPath, movements);

  // Update product quantity in products.json
  const products = readData(productsDbPath);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) {
    console.error('[ERROR] Product not found for update:', productId);
    return res.status(404).json({ message: 'Producto no encontrado' });
  }

  console.log(`[DEBUG POST] Product ${productId} old quantity: ${products[productIndex].quantity}, type: ${type}, quantity: ${quantity}`);
  if (type === 'entry') {
    products[productIndex].quantity += quantity;
  } else if (type === 'exit') {
    products[productIndex].quantity -= quantity;
  }
  console.log(`[DEBUG POST] New quantity: ${products[productIndex].quantity}`);
  writeData(productsDbPath, products);

  res.status(201).json(newMovement);
  console.log('POST /api/inventory-movements successful.');
  logProductQuantity(productId, 'POST AFTER');
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

// Update inventory movement
app.put('/api/inventory-movements/:id', (req, res) => {
  console.log('PUT /api/inventory-movements/:id received. ID:', req.params.id);
  const movementId = parseInt(req.params.id, 10);
  const { type, quantity, value, notes } = req.body;

  if (isNaN(movementId)) {
    return res.status(400).json({ message: 'El ID del movimiento debe ser un número válido' });
  }

  let movements = readData(inventoryMovementsDbPath);
  const movementIndex = movements.findIndex(m => m.id === movementId);
  if (movementIndex === -1) {
    return res.status(404).json({ message: 'Movimiento no encontrado' });
  }

  const oldMovement = movements[movementIndex];
  const productId = oldMovement.productId;
  logProductQuantity(productId, 'PUT BEFORE');

  const oldEffect = oldMovement.type === 'entry' ? oldMovement.quantity : -oldMovement.quantity;

  // Validate new data
  if (type !== 'entry' && type !== 'exit') {
    return res.status(400).json({ message: 'El tipo debe ser "entry" o "exit"' });
  }
  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un número positivo válido' });
  }
  if (type === 'entry' && (isNaN(value) || value < 0)) {
    return res.status(400).json({ message: 'Para entradas, el valor (costo) debe ser un número válido >= 0' });
  }

  const newQuantity = parseFloat(quantity);
  const newEffect = type === 'entry' ? newQuantity : -newQuantity;
  const delta = newEffect - oldEffect;

  // Update movement
  movements[movementIndex] = {
    ...oldMovement,
    type,
    quantity: newQuantity,
    ...(type === 'entry' ? { value: parseFloat(value) } : {}),
    notes: notes || '',
    date: new Date().toISOString() // Update date on edit
  };
  writeData(inventoryMovementsDbPath, movements);

  // Adjust product quantity
  const products = readData(productsDbPath);
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    products[productIndex].quantity += delta;
    writeData(productsDbPath, products);
    logProductQuantity(productId, 'PUT AFTER');
  } else {
    console.error('Product not found for adjustment:', productId);
  }

  res.json(movements[movementIndex]);
  console.log('PUT /api/inventory-movements/:id successful.');
});

// Update inventory movement
app.put('/api/inventory-movements/:id', (req, res) => {
  console.log('PUT /api/inventory-movements/:id received. ID:', req.params.id);
  const movementId = parseInt(req.params.id, 10);
  const { type, quantity, value, notes } = req.body;

  if (isNaN(movementId)) {
    return res.status(400).json({ message: 'El ID del movimiento debe ser un número válido' });
  }

  let movements = readData(inventoryMovementsDbPath);
  const movementIndex = movements.findIndex(m => m.id === movementId);
  if (movementIndex === -1) {
    return res.status(404).json({ message: 'Movimiento no encontrado' });
  }

  const oldMovement = movements[movementIndex];
  const oldEffect = oldMovement.type === 'entry' ? oldMovement.quantity : -oldMovement.quantity;

  // Validate new data
  if (type !== 'entry' && type !== 'exit') {
    return res.status(400).json({ message: 'El tipo debe ser "entry" o "exit"' });
  }
  if (isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un número positivo válido' });
  }
  if (type === 'entry' && (isNaN(value) || value < 0)) {
    return res.status(400).json({ message: 'Para entradas, el valor (costo) debe ser un número válido >= 0' });
  }

  const newQuantity = parseFloat(quantity);
  const newEffect = type === 'entry' ? newQuantity : -newQuantity;
  const delta = newEffect - oldEffect;

  // Update movement
  movements[movementIndex] = {
    ...oldMovement,
    type,
    quantity: newQuantity,
    ...(type === 'entry' ? { value: parseFloat(value) } : {}),
    notes: notes || '',
    date: new Date().toISOString() // Update date on edit
  };
  writeData(inventoryMovementsDbPath, movements);

  // Adjust product quantity
  const products = readData(productsDbPath);
  const productIndex = products.findIndex(p => p.id === oldMovement.productId);
  if (productIndex !== -1) {
    products[productIndex].quantity += delta;
    writeData(productsDbPath, products);
  }

  res.json(movements[movementIndex]);
  console.log('PUT /api/inventory-movements/:id successful.');
});

// --- COMPANY ROUTES ---
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

// Helper functions for brands and categories
const readBrands = () => {
  try {
    if (!fs.existsSync(brandDbPath)) {
      fs.writeFileSync(brandDbPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(brandDbPath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading brands:', error);
    return [];
  }
};

const writeBrands = (data) => {
  try {
    fs.writeFileSync(brandDbPath, JSON.stringify(data, null, 2));
    logToFile(`Éxito: Escribió ${data.length} marcas a brands.json`);
  } catch (error) {
    console.error('Error writing brands:', error);
    logToFile(`Error al escribir marcas a brands.json: ${error.message}`, true);
  }
};

const readCategories = () => {
  try {
    if (!fs.existsSync(categoryDbPath)) {
      fs.writeFileSync(categoryDbPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(categoryDbPath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
};

const writeCategories = (data) => {
  try {
    fs.writeFileSync(categoryDbPath, JSON.stringify(data, null, 2));
    logToFile(`Éxito: Escribió ${data.length} categorías a categories.json`);
  } catch (error) {
    console.error('Error writing categories:', error);
    logToFile(`Error al escribir categorías a categories.json: ${error.message}`, true);
  }
};

const actividadComercialDbPath = path.join(__dirname, 'actividad-comercial.json');

const readActividadComercial = () => {
  try {
    if (!fs.existsSync(actividadComercialDbPath)) {
      fs.writeFileSync(actividadComercialDbPath, JSON.stringify([]));
    }
    const data = fs.readFileSync(actividadComercialDbPath);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading actividad comercial:', error);
    return [];
  }
};

// --- BRAND ROUTES ---
app.get('/api/brands', (req, res) => {
  const brands = readBrands();
  res.json(brands);
});

app.post('/api/brands', (req, res) => {
  const brands = readBrands();
  const newBrand = {
    id: brands.length > 0 ? Math.max(...brands.map(b => b.id)) + 1 : 1,
    name: req.body.name,
    imagen: req.body.imagen || ''
  };
  brands.push(newBrand);
  writeBrands(brands);
  res.status(201).json(newBrand);
});

app.put('/api/brands/:id', (req, res) => {
  const brands = readBrands();
  const brandId = parseInt(req.params.id, 10);
  const index = brands.findIndex(b => b.id === brandId);
  if (index === -1) {
    return res.status(404).json({ message: 'Marca no encontrada' });
  }
  brands[index].name = req.body.name;
  if (req.body.imagen) {
    brands[index].imagen = req.body.imagen;
  }
  writeBrands(brands);
  res.json(brands[index]);
});

app.delete('/api/brands/:id', (req, res) => {
  let brands = readBrands();
  const brandId = parseInt(req.params.id, 10);
  const initialLength = brands.length;
  brands = brands.filter(b => b.id !== brandId);
  if (brands.length === initialLength) {
    return res.status(404).json({ message: 'Marca no encontrada' });
  }
  writeBrands(brands);
  res.status(204).send();
});

// --- CATEGORY ROUTES ---
app.get('/api/categories', (req, res) => {
  const categories = readCategories();
  res.json(categories);
});

app.post('/api/categories', (req, res) => {
  const categories = readCategories();
  const newCategory = {
    id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
    name: req.body.name
  };
  categories.push(newCategory);
  writeCategories(categories);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', (req, res) => {
  const categories = readCategories();
  const categoryId = parseInt(req.params.id, 10);
  const index = categories.findIndex(c => c.id === categoryId);
  if (index === -1) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }
  categories[index].name = req.body.name;
  writeCategories(categories);
  res.json(categories[index]);
});

app.delete('/api/categories/:id', (req, res) => {
  let categories = readCategories();
  const categoryId = parseInt(req.params.id, 10);
  const initialLength = categories.length;
  categories = categories.filter(c => c.id !== categoryId);
  if (categories.length === initialLength) {
    return res.status(404).json({ message: 'Categoría no encontrada' });
  }
  writeCategories(categories);
  res.status(204).send();
});

// --- ACTIVIDAD COMERCIAL ROUTES ---
app.get('/api/actividad-comercial', (req, res) => {
  const actividades = readActividadComercial();
  res.json(actividades);
});


const products = readData(productsDbPath);

const getPrerenderParamsForProducts = () => {
  return products.map(product => ({ id: product.id.toString() }));
};

const getPrerenderParamsForEditProduct = () => {
  return products.map(product => ({ id: product.id.toString() }));
};

// Export functions for prerendering
module.exports.getPrerenderParams = {
  'products/:id': getPrerenderParamsForProducts,
  'admin/edit-product/:id': getPrerenderParamsForEditProduct
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
