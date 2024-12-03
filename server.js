const { MongoClient, ObjectId } = require("mongodb");
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const axios = require("axios");


const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

var dotenv = require("dotenv").config();
var new_uri = process.env.mongo_uri;
var api_key = process.env.spoon_api_key;


const recipeRoutes = require('./routes/recipes');
app.use('/api/recipes', recipeRoutes);

const spoonacularRoutes = require('./routes/spoonacular');
app.use('/', spoonacularRoutes);

const mongoose = require('mongoose');
// Connect to MongoDB using Mongoose
mongoose.connect(process.env.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
});
//=========================== FUNCTIONS ===========================


async function getUserInfo(email) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("users");
        const user = await collection.findOne({
            email: email,
        });


        return user;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await client.close();
    }
}

async function registerUser(email, password, lname, fname) {
    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const client = new MongoClient(new_uri);
    await client.connect();
    const dbName = client.db("feastify");
    const collection = dbName.collection("users");

    await collection.insertOne({
        email: email,
        password: hashedPassword,
        fname: fname,
        lname: lname
    });

    await client.close();
}

async function getUser(uid) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("users");
        const user = await collection.findOne({
            _id: new ObjectId(uid)
        });


        return user;
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await client.close();
    }
}

async function getPantry(uid) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("pantry");
        const res = collection.find({ owner: uid });


        let items = []
        for await (var doc of res) {
            doc._id = doc._id.toString();
            items.push(doc);
        }
        return items;
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();


    }
}

async function getGroceries(uid) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        const res = collection.find({ owner: uid });


        let items = []
        for await (var doc of res) {
            doc._id = doc._id.toString();
            items.push(doc);
        }
        return items;
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();


    }
}



async function addToPantry(uid, ingredient) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("pantry");
        const query = { owner: uid, spoonacular_id: ingredient.spoonacular_id }
        const item = await collection.findOne(query);
        if (item === null) {
            let { nutrition, cost } = await getCostAndNutrition(ingredient.spoonacular_id)
            ingredient.nutrition = nutrition;
            ingredient.cost = cost;
            ingredient.owner = uid;
            let res = await collection.insertOne(ingredient);
        } else {
            let amount = item.amount + ingredient.amount;
            const result = await collection.updateOne({ owner: new ObjectId(uid), spoonacular_id: ingredient.spoonacular_id }, { $set: { amount: amount } });

        }

    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();

    }
}

async function addToGroceries(uid, ingredient) {
    const client = new MongoClient(new_uri);
    console.log("adding ingredient to gro db");
    try {
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        const query = { owner: new ObjectId(uid), spoonacular_id: ingredient.spoonacular_id }
        const item = await collection.findOne(query);
        console.log(item);
        if (item === null) {
            ingredient.owner = uid;
            console.log(ingredient);
            let res = await collection.insertOne(ingredient);

            console.log(res.insertedId);
        } else {
            let amount = item.amount + ingredient.amount;
            await collection.updateOne({ owner: new ObjectId(uid), spoonacular_id: ingredient.spoonacular_id }, { $set: { amount: amount } });
        }
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();
    }
}

async function getCostAndNutrition(spoon_id) {
    let query = `?apiKey=${api_key}&amount=1`;
    const res = await axios.get(`https://api.spoonacular.com/food/ingredients/${spoon_id}/information${query}`);
    return { nutrition: res.data.nutrition, cost: res.data.estimatedCost };
}

async function getIngredients(searchTerm) {
    let query = `?query=${searchTerm}&number=${10}&apiKey=${api_key}`;
    const res = await axios.get(`https://api.spoonacular.com/food/ingredients/search${query}`);
    return res.data.results;
}

async function updateGroceryItem(uid, ingredient, amount) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        await collection.updateOne({ owner: new ObjectId(uid), spoonacular_id: ingredient.spoonacular_id }, { $set: { amount } });
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();
    }
}

async function deleteGroceryItem(uid, ingredient_id) {
    console.log("delete uid: ", uid, "id:", ingredient_id);
    const client = new MongoClient(new_uri);
    try {
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        const result = await collection.deleteOne({ owner: uid, _id: new ObjectId(ingredient_id) });
        console.log(result.deletedCount);
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();
    }
}

async function clearGroceryList(uid) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        const query = { owner: uid }
        if (query != null) {
            await collection.deleteMany({});
        }
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();
    }
}


//=========================== ROUTES ===========================


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/recipes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recipes.html'));
});

app.get('/pantry', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recipes.html'));
});

app.get('/groceries', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'groceries.html'));
});


// =========================== REQUESTS ===========================

app.post('/getUser', async(req, res) => {
    const user = getUser(req.body.uid);
    if (user !== null) {
        res.json({ user })
    } else {
        res.status(400).json({ message: "User not found" });
    }
})

app.post('/addToPantry', async(req, res) => {
    await addToPantry(req.body.owner, req.body.ingredient);
    res.sendStatus(200);
})

app.post('/getPantry', async(req, res) => {
    const pantry = await getPantry(req.body.owner);
    res.json({ pantry });
})

app.post('/findIngredients', async(req, res) => {
    const searchTerm = req.body.term;
    const ingredients = await getIngredients(searchTerm);
    res.json(ingredients);
})

app.post('/requestLogin', async(req, res) => {
    const { email, password } = req.body;

    const user = await getUserInfo(email);
    if (user !== null) {
        let valid = await bcrypt.compare(password, user.password);
        if (valid) {
            res.json({ success: true, uid: user._id })
        } else {
            res.json({ success: false, message: "Invalid username or password " });
        }
    } else {
        res.json({ success: false, message: "No account exists with that email" });
    }

});

app.post('/requestRegister', async(req, res) => {
    const requestData = req.body;
    const email = requestData.email;
    const password = requestData.password;
    const fname = requestData.fname;
    const lname = requestData.lname;
    try {
        const user = await getUserInfo(email);
        if (user != null) {
            res.json({
                success: false,
                message: "email already exists in database",
            });
        } else {
            await registerUser(email, password, lname, fname);
            res.json({
                success: true
            });
        }
    } catch (error) {
        res.status(500).send({
            error: `An error occurred during registration: ${error}`,
        });
    }
});

app.post('/addToGroceries', async(req, res) => {
    console.log("ay");
    await addToGroceries(req.body.owner, req.body.ingredient);
    res.sendStatus(200);
})

app.post('/getGroceries', async(req, res) => {
    const groceries = await getGroceries(req.body.owner);
    res.json({ groceries });
})

// Update a grocery item's amount
app.put('/api/groceries/:id', async(req, res) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;
        await updateGroceryItem(id, amount);
        res.send("Item updated successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating grocery item");
    }
});

// Delete a grocery item
app.post('/api/groceries/delete/:id', async(req, res) => {

    try {
        const { id } = req.params;
        console.log(req.body);
        const uid = req.body.owner;
        await deleteGroceryItem(uid, id);
        res.send("Item deleted successfully");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting grocery item");
    }
});

// Clear all grocery items
app.delete('/api/groceries/:uid', async(req, res) => {
    try {
        const { uid } = req.params;
        await clearGroceryList(uid);
        res.json({ message: "Grocery list cleared successfully" });
    } catch (error) {
        console.error("Error in /api/groceries/:uid DELETE:", error);
        res.status(500).json({ error: "Failed to clear grocery list" });
    }
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});