const { MongoClient, ObjectId } = require("mongodb");
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const axios = require("axios");
const crypto = require('crypto');

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
            const result = await collection.updateOne({ owner: uid, spoonacular_id: ingredient.spoonacular_id }, { $set: { amount: amount } });
        }

    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();

    }
}

async function updatePantry(uid, ingredient, newAmount) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("pantry");
        const query = { owner: uid, spoonacular_id: ingredient.spoonacular_id }
        const result = await collection.updateOne(query, { $set: { amount: newAmount } });
        console.log("Matched: ", result.matchedCount);

    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();

    }
}

async function deleteFromPantry(uid, ingredient) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();

        const dbName = client.db("feastify");
        const collection = dbName.collection("pantry");
        const query = { owner: uid, spoonacular_id: ingredient.spoonacular_id }
        const result = await collection.deleteOne(query);
        console.log("Deleted: ", result.deletedCount);

    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();

    }
}

async function addToGroceries(uid, ingredient) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        const query = { owner: uid, spoonacular_id: ingredient.spoonacular_id }
        const item = await collection.findOne(query);
        if (item === null) {
            let { nutrition, cost } = await getCostAndNutrition(ingredient.spoonacular_id)
            ingredient.nutrition = nutrition;
            ingredient.cost = cost;
            ingredient.owner = uid;
            await collection.insertOne(ingredient);
        } else {
            console.log("hello");
            let amount = item.amount + ingredient.amount;
            await collection.updateOne({ owner: uid, spoonacular_id: ingredient.spoonacular_id }, { $set: { amount: amount } });
        }
    } catch (error) {
        console.error("error");
        throw error;
    } finally {
        await client.close();
    }
}

async function addToGroceriesManual(uid, ingredient) {
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
            const hash = crypto.createHash('sha256').update(ingredient.name).digest('hex');
            const spoonacularId = -parseInt(hash, 16);
            ingredient.spoonacular_id = spoonacularId;
            await collection.insertOne(ingredient);
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

async function getRecipeByID(id) {
    let query = `?apiKey=${api_key}`;
    const res = await axios.get(`https://api.spoonacular.com/recipes/${id}/information${query}`);
    return res.data;
}

async function getRecipesFromPantry(pantry) {
    let query = '?includeIngredients=';
    for (var i = 0; i < pantry.length; i++) {
        query += pantry[i].name;
        if (i < pantry.length - 1) {
            query += ",+";
        }
    }
    query += `&number=${10}&apiKey=${api_key}&sort=min-missing-ingredients`;
    query = `https://api.spoonacular.com/recipes/complexSearch${query}`;
    console.log(query);
    const res = await axios.get(query);
    console.log(res.data);
    results = [];
    for (var recipe of res.data.results) {
        if (recipe.missedIngredientCount === 0) {
            let doc = await getRecipeByID(recipe.id);
            results.push(doc);
        }
    }
    console.log(results);
    return results;
}

async function updateGroceryItem(uid, ingredient_id, new_amount) {
    const client = new MongoClient(new_uri);
    try {
        await client.connect();
        const dbName = client.db("feastify");
        const collection = dbName.collection("groceries");
        await collection.updateOne({ owner: uid, _id: new ObjectId(ingredient_id) }, { $set: { amount: new_amount } });
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

app.post('/updatePantry', async(req, res) => {
    await updatePantry(req.body.owner, req.body.ingredient, req.body.newAmount);
    res.sendStatus(200);
})

app.post('/deleteFromPantry', async(req, res) => {
    await deleteFromPantry(req.body.owner, req.body.ingredient);
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

app.post('/findRecipesFromPantry', async(req, res) => {
    let owner = req.body.owner;
    const pantry = await getPantry(owner);
    const recipes = await getRecipesFromPantry(pantry);
    res.json(recipes);
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
                message: "We already have an account with that email!",
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
    await addToGroceries(req.body.owner, req.body.ingredient);
    res.sendStatus(200);
})

app.post('/addToGroceriesManual', async(req, res) => {
    console.log("ay");
    await addToGroceriesManual(req.body.owner, req.body.ingredient);
    res.sendStatus(200);
})

app.post('/getGroceries', async(req, res) => {
    const groceries = await getGroceries(req.body.owner);
    res.json({ groceries });
})

// Update a grocery item's amount
app.post('/updateGroceryItem', async(req, res) => {
    try {
        const { uid, id, amount } = req.body;
        await updateGroceryItem(uid, id, amount);
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