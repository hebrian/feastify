async function fetchRecipes() {

    const userId = localStorage.getItem("uid"); // Assuming userId is stored in sessionStorage
    console.log(userId);
    if (!userId) {
        console.error('User ID is not available');
        return;
    }

    try {
        const response = await fetch(`/api/recipes?userId=${userId}`);
        const recipes = await response.json();

        const blurbs = document.getElementById('blurbs');
        console.log(recipes);
        recipes.forEach(recipe => {

            const blurb = document.createElement('div');
            blurb.className = "recipe-blurb";
            blurb.innerHTML = `
                <img src="${recipe.image}" class="recipe-blurb-img">
                <p class="recipe-blurb-name">${recipe.name}</p>
            
            `;
            blurb.onclick = () => {
                window.location.href = `recipe.html?id=${recipe._id}`;
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



    } catch (err) {
        console.error('Error fetching recipes:', err);
    }
}



window.onload = fetchRecipes;