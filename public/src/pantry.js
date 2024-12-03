let view = "pantry";
let pantry = [];
let searchPantry = [];

function setPantryView(list) {
    let results = document.getElementById('results');
    results.innerHTML = "";
    list.forEach((ingredient) => {
        let item = document.createElement("li");
        item.innerText = ingredient.name;
        results.appendChild(item);
    })
}

function handlePantryForm(event) {
    event.preventDefault();
    const term = document.getElementById('search').value;
    const pattern = new RegExp(term, "gi");
    searchPantry = pantry.filter((item) =>
        item.name.match(pattern)
    );
    setPantryView(searchPantry);
}

function handleAddForm(event) {
    event.preventDefault();

    const term = document.getElementById('search').value;

    fetch('/findIngredients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ term: term })
        })
        .then(response => response.json())
        .then(data => {
            let results = document.getElementById('results');
            results.innerHTML = "";
            console.log(data);
            data.forEach((ingredient) => {
                let item = document.createElement("li");
                let button = document.createElement("button");
                button.addEventListener("click", () => { addToPantry(ingredient) });

                button.innerText = ingredient.name;
                item.appendChild(button);
                results.appendChild(item);
            })
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

document.getElementById('pantry-search-form').addEventListener('submit', function(event) {

    if (view === "pantry") {
        handlePantryForm(event);
    } else {
        handleAddForm(event);
    }
});

async function addToPantry(ingredient) {

    ingredient.spoonacular_id = ingredient.id;
    delete ingredient.id;
    delete ingredient.image;
    ingredient.amount = 1;
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
            setPantryView(pantry);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
loadPantry();

function toggleView(v) {
    document.getElementById('search').value = "";
    view = v;
    if (v === "pantry") {
        document.getElementById("results-container").style.display = 'hidden';
        document.getElementById("pantry-container").style.display = 'block';
        loadPantry();
        document.getElementById("search").placeholder = "Search Pantry";
    } else {
        document.getElementById("results-container").style.display = 'block';
        document.getElementById("pantry-container").style.display = 'hidden';
        document.getElementById("results").innerHTML = "";
        document.getElementById("search").placeholder = "Find Items";
    }
}



viewRadios = document.getElementsByClassName("views-radio");
console.log(viewRadios);
Array.from(viewRadios).forEach((radio) => {
    radio.addEventListener("change", (event) => {
        console.log(event.target.value);
        toggleView(event.target.value);
    })
})