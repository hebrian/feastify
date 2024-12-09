const searchButton = document.getElementById("search-button");
const searchResults = document.getElementById("search-results");
const shoppedButton = document.getElementById("shopped-button");

let view = "grocery";
let groceries = [];
let searchList = [];
let previousFindTerm = "";

function updateIngredient(ingredient, amount) {
    let owner = localStorage.getItem("uid")
    fetch('/updateGroceryItem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: owner, id: ingredient._id, amount: amount })
    }).catch(error => {
        console.error('Error:', error);
    });
}


function ingredientBlurb(ingredient, type) {
    const blurb = document.createElement('div');
    blurb.className = "ingredient-blurb";
    let name = document.createElement("p");
    name.innerText = ingredient.name;
    blurb.appendChild(name);
    const buttons = document.createElement('div');
    buttons.className = "crud-buttons";

    if (type === "grocery") {

        const amount = document.createElement("span");
        var wps = ingredient.nutrition.weightPerServing.amount;
        if (wps === 0 || wps === undefined) {
            wps = 1;
        }
        amount.innerText = Math.ceil(ingredient.amount / wps);
        amount.classList.add("crud-button");
        amount.classList.add("amount");

        const plus = document.createElement("span");
        plus.classList.add("crud-button");
        plus.classList.add("plus");
        plus.classList.add("button");
        plus.innerText = '+';
        plus.onclick = () => {
            let newAmount = parseInt(amount.innerText) + 1;
            amount.innerText = newAmount
            updateIngredient(ingredient, newAmount);
        }

        const minus = document.createElement("span");
        minus.classList.add("crud-button");
        minus.classList.add("minus");
        minus.classList.add("button");
        minus.innerText = '-';
        minus.onclick = () => {

            let newAmount = parseInt(amount.innerText) - 1;
            if (newAmount === 0) {
                removeGrocery(ingredient._id);
                blurb.remove();
            }
            amount.innerText = newAmount;

            updateIngredient(ingredient, newAmount);
        }

        buttons.appendChild(minus);
        buttons.appendChild(amount);
        buttons.appendChild(plus);


    } else {
        const plus = document.createElement("span");
        plus.classList.add("crud-button");
        plus.classList.add("add");
        plus.classList.add("button");
        plus.innerText = 'Add';
        plus.onclick = async() => {
            await addToGroceries(ingredient);
            loadGroceries();
        }
        buttons.appendChild(plus);
    }
    blurb.appendChild(buttons);

    return blurb;
}

function setGroceryView(list) {
    console.log(list);
    let results = document.getElementById('grocery-container');
    results.innerHTML = "";
    list.forEach((ingredient) => {
        const blurb = ingredientBlurb(ingredient, "grocery");
        if (blurb !== null) {
            results.appendChild(blurb);
        }
    })
}

async function loadGroceries() {
    let owner = localStorage.getItem("uid");
    console.log("Loading groceries for UID:", owner);

    fetch('/getGroceries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ owner: owner })
        })
        .then(response => response.json())
        .then(data => {
            groceries = data.groceries;
            groceries.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            setGroceryView(groceries);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


// Add grocery item to the database and update the table
async function addToGroceries(ingredient) {
    // Assign spoonacular ID to match the database logic
    ingredient.spoonacular_id = ingredient.id;
    delete ingredient.id; // Avoid conflict with MongoDB's _id
    delete ingredient.image; // Simplify storage (optional)
    ingredient.amount = 1; // Default amount

    // Fetch UID from localStorage or relevant source
    let owner = localStorage.getItem("uid");
    console.log("Owner UID:", owner);

    try {
        const response = await fetch('/addToGroceries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner: owner, ingredient: ingredient })
        });

        if (response.ok) {
            console.log(ingredient);

            console.log("Grocery item added successfully");
        } else {
            console.error("Failed to add grocery item:", await response.text());
        }
    } catch (error) {
        console.error("Error adding grocery item:", error);
    }
    loadGroceries();
}

document.getElementById('search').addEventListener('input', () => {
    if (view === "grocery") {
        const term = document.getElementById('search').value;
        const pattern = new RegExp(term, "gi");
        searchList = groceries.filter((item) =>
            item.name.match(pattern)
        );
        setGroceryView(searchList);
    }
});


const removeGrocery = async(id) => {
    await fetch(`/api/groceries/delete/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: localStorage.getItem("uid") }) });
    loadGroceries();
};

// Clear the entire grocery list
async function clearGroceryList() {
    let owner = localStorage.getItem("uid");
    console.log("Adding pantry from groceries for UID:", owner);

    try {
        // Step 1: Fetch all grocery items
        const response = await fetch(`/getGroceries`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner: owner }),
        });

        if (!response.ok) {
            console.error("Failed to fetch grocery items:", await response.text());

            return;
        }

        const data = await response.json();
        console.log(data);

        // Step 2: Add each grocery item to the pantry
        for (const item of data.groceries) {
            const { _id, ...itemWithoutId } = item;
            await fetch('/addToPantry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner: owner, ingredient: itemWithoutId }),
            }).catch(error => {
                console.error("Error adding to pantry:", error);
            });
        }

        // Step 3: Clear all grocery items
        const deleteResponse = await fetch(`/api/groceries/${owner}`, {
            method: 'DELETE',
        });

        if (deleteResponse.ok) {
            let popup = document.getElementById('popup');
            popup.classList.remove("hide");
            loadGroceries();
        } else {
            console.error("Failed to clear grocery items:", await deleteResponse.text());

        }
    } catch (error) {
        console.error("Error during clearing grocery list:", error);
    }
}

document.getElementById('grocery-search-form').addEventListener('submit', function(event) {
    handleAddForm(event);
});

function handleAddForm(event) {
    event.preventDefault();

    const term = document.getElementById('search').value;
    previousFindTerm = term;

    fetch('/findIngredients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ term: term })
        })
        .then(response => response.json())
        .then(data => {
            let results = document.getElementById('results-container');
            results.innerHTML = "";
            console.log(data);
            data.forEach((ingredient) => {
                const blurb = ingredientBlurb(ingredient, "search")

                results.appendChild(blurb);
            })
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Event listener for "Shopped" button
shoppedButton.addEventListener('click', clearGroceryList);

// Initial load
function toggleView(v) {
    console.log(previousFindTerm);
    document.getElementById('search').value = "";
    view = v;
    if (v === "grocery") {
        document.getElementById("results-container").classList.add("hide");
        document.getElementById("grocery-container").classList.remove("hide");
        loadGroceries();

        document.getElementById("search").placeholder = "Search Grocery List";
        document.getElementById("grocery-view").className = "views-span-checked";
        document.getElementById("search-view").className = "views-span";

        document.getElementById("search-button").classList.add("hide");

        document.getElementById("search").classList.remove("search-input-find-view");

    } else {
        document.getElementById("results-container").classList.remove("hide");
        document.getElementById("grocery-container").classList.add("hide");

        document.getElementById("search").placeholder = "Find Items";
        document.getElementById("search").value = previousFindTerm;
        document.getElementById("search-view").className = "views-span-checked";
        document.getElementById("grocery-view").className = "views-span";

        document.getElementById("search-button").classList.remove("hide");
        document.getElementById("search").classList.add("search-input-find-view");
    }
}

loadGroceries();
toggleView("grocery");

viewRadios = document.getElementsByClassName("views-radio");
console.log(viewRadios);
Array.from(viewRadios).forEach((radio) => {
    radio.addEventListener("change", (event) => {
        console.log(event.target.value);
        toggleView(event.target.value);
    })
})