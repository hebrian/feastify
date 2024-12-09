let view = "pantry";
let pantry = [];
let searchPantry = [];
let previousFindTerm = ""

function updateIngredient(ingredient, amount) {
    let owner = localStorage.getItem("uid")
    fetch('/updatePantry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: owner, ingredient: ingredient, newAmount: amount })
    }).catch(error => {
        console.error('Error:', error);
    });
}

function deleteIngredient(ingredient) {
    let owner = localStorage.getItem("uid")
    fetch('/deleteFromPantry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: owner, ingredient: ingredient })
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

    if (type === "pantry") {

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
                deleteIngredient(ingredient);
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
        plus.onclick = () => {
            addToPantry(ingredient);
            loadPantry();
        }
        buttons.appendChild(plus);
    }
    blurb.appendChild(buttons);
    // <div class="crud-buttons">
    //             <span class="crud-button minus button">-</span><span class="crud-button amount">1</span><span class="crud-button plus button">+</span>
    //         </div>
    return blurb;
}

function setPantryView(list) {
    console.log(list);
    let results = document.getElementById('pantry-container');
    results.innerHTML = "";
    list.forEach((ingredient) => {
        const blurb = ingredientBlurb(ingredient, "pantry");
        if (blurb !== null) {
            results.appendChild(blurb);
        }
    })
}

document.getElementById('search').addEventListener('input', () => {
    if (view === "pantry") {
        const term = document.getElementById('search').value;
        const pattern = new RegExp(term, "gi");
        searchPantry = pantry.filter((item) =>
            item.name.match(pattern)
        );
        setPantryView(searchPantry);
    }
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

document.getElementById('pantry-search-form').addEventListener('submit', function(event) {
    handleAddForm(event);
});

async function addToPantry(ingredient) {
    if (ingredient.spoonacular_id === undefined) {
        ingredient.spoonacular_id = ingredient.id;
        delete ingredient.id;
        delete ingredient.image;
        ingredient.amount = 1;
    }
    console.log(ingredient);
    let owner = localStorage.getItem("uid");
    fetch('/addToPantry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner: owner, ingredient: ingredient })
    }).catch(error => {
        console.error('Error:', error);
    });
}

async function loadPantry() {
    let owner = localStorage.getItem("uid");
    console.log(owner);
    fetch('/getPantry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ owner: owner })
        })
        .then(response => response.json())
        .then(data => {

            pantry = data.pantry;
            pantry.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            setPantryView(pantry);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function toggleView(v) {
    console.log(previousFindTerm);
    document.getElementById('search').value = "";
    view = v;
    if (v === "pantry") {
        document.getElementById("results-container").classList.add("hide");
        document.getElementById("pantry-container").classList.remove("hide");


        document.getElementById("search").placeholder = "Search Pantry";
        document.getElementById("pantry-view").className = "views-span-checked";
        document.getElementById("search-view").className = "views-span";

        document.getElementById("search-button").classList.add("hide");

        document.getElementById("search").classList.remove("search-input-find-view");

    } else {
        document.getElementById("results-container").classList.remove("hide");
        document.getElementById("pantry-container").classList.add("hide");

        document.getElementById("search").placeholder = "Find Items";
        document.getElementById("search").value = previousFindTerm;
        document.getElementById("search-view").className = "views-span-checked";
        document.getElementById("pantry-view").className = "views-span";

        document.getElementById("search-button").classList.remove("hide");
        document.getElementById("search").classList.add("search-input-find-view");
    }
}

loadPantry();
toggleView("pantry");

viewRadios = document.getElementsByClassName("views-radio");
console.log(viewRadios);
Array.from(viewRadios).forEach((radio) => {
    radio.addEventListener("change", (event) => {
        console.log(event.target.value);
        toggleView(event.target.value);
    })
})