async function fetchRecipe() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const recipeId = params.get('id');

    console.log(recipeId);


    try {
        const response = await fetch(`/api/recipes/recipe?recipeID=${recipeId}`); // Pass userId as a query parameter
        const recipe = await response.json();

        const recipeContainer = document.getElementById('recipe');
        recipeContainer.innerHTML = ''; // Clear existing rows
        const header = document.createElement("div");
        header.className = "recipe-header";
        header.innerHTML = `
            <h1>${recipe.name}</h1>
            <ul>
                <li>Serves: ${recipe.meta.serves}</li>
                <li>Cost: $${recipe.meta.cost.toFixed(2)}</li>
            </ul>
        `;
        const ingredients = document.createElement("div");
        const steps = document.createElement("div");

        let ingredientsHeader = document.createElement("h2");
        ingredientsHeader.innerText = "Ingredients";
        ingredients.appendChild(ingredientsHeader);
        let ingredientsList = document.createElement("ul");
        recipe.ingredients.forEach(element => {
            let item = document.createElement("li");
            item.innerText = element.name;
            ingredientsList.appendChild(item);
        });
        ingredients.appendChild(ingredientsList);

        let stepsHeader = document.createElement("h2");
        stepsHeader.innerText = "Steps";
        steps.appendChild(stepsHeader);
        let stepsList = document.createElement("ol");
        recipe.steps.forEach(element => {
            let item = document.createElement("li");
            item.innerText = element;
            stepsList.appendChild(item);
        });
        steps.appendChild(stepsList);


        recipeContainer.appendChild(header);
        recipeContainer.appendChild(ingredients);
        recipeContainer.appendChild(steps);


    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
}

window.onload = fetchRecipe;