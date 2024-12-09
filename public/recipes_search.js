function populateResults(recipes) {
    const blurbs = document.getElementById('blurbs');
    console.log(recipes);
    recipes.forEach(recipe => {

        const blurb = document.createElement('div');
        blurb.className = "recipe-blurb";
        blurb.innerHTML = `
            <img src="${recipe.image}" class="recipe-blurb-img">
            <p class="recipe-blurb-name">${recipe.title}</p>
        
        `;
        blurb.onclick = () => {
            localStorage.setItem("previewRecipe", JSON.stringify(recipe));
            window.location.href = `recipe.html`;
        }
        blurbs.appendChild(blurb);

        //         row.innerHTML = `
        //     <td><a href="recipe.html?id=${recipe._id}">${recipe.name}</a></td>
        //     <td>${recipe.meta.serves || 'N/A'}</td>
        //     <td>${recipe.meta.cuisine || 'Unknown'}</td>
        //     <td>${recipe.meta.cost ? `$${recipe.meta.cost.toFixed(2)}` : 'N/A'}</td>
        //     <td>0</td> <!-- Default value for now -->
        // `;

    });
}

document.getElementById('search-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form submission

    const query = document.getElementById('search-query').value;

    try {
        // Fetch recipes from the Spoonacular API via your backend
        const response = await fetch(`/api/spoonacular?query=${query}`);
        const recipes = await response.json();
        populateResults(recipes);

    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
});

document.getElementById('pantry-search').addEventListener('click', async function() {
    let owner = localStorage.getItem("uid");
    fetch('/findRecipesFromPantry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ owner: owner })
        })
        .then(response => response.json())
        .then(data => {
            populateResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
})