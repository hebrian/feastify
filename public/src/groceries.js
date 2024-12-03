document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("search-bar");
    const searchButton = document.getElementById("search-button");
    const searchResults = document.getElementById("search-results");
    const groceryTable = document.getElementById("grocery-table").querySelector("tbody");
    const shoppedButton = document.getElementById("shopped-button");

    const API_KEY = '9623bac1fe144fb1a5cf881f085f66d1';

    const manualAddButton = document.getElementById("manual-add-button");
    const modal = document.getElementById("manual-add-modal");
    const closeModal = document.getElementById("close-modal");
    const manualAddForm = document.getElementById("manual-add-form");

    // Open the modal
    manualAddButton.addEventListener("click", () => {
        modal.style.display = "block";
    });

    // Close the modal
    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Close the modal when clicking outside of it
    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Handle manual add form submission
    manualAddForm.addEventListener("submit", async(event) => {
        event.preventDefault();

        const name = document.getElementById("manual-name").value.trim();
        const amount = parseInt(document.getElementById("manual-amount").value, 10);

        if (!name || amount <= 0) {
            alert("Please provide valid name and amount.");
            return;
        }

        const owner = localStorage.getItem("uid");
        console.log("Owner UID:", owner);
        const ingredient = { name, amount, owner };

        try {
            const response = await fetch(`/addToGroceries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner: owner, ingredient: ingredient })
            });

            if (response.ok) {
                console.log("Manually added grocery item:", ingredient);
                alert("Item added successfully!");
                modal.style.display = "none"; // Close the modal
                fetchGroceries(); // Refresh the grocery list
            } else {
                console.error("Failed to manually add grocery item:", await response.text());
                alert("Failed to add item.");
            }
        } catch (error) {
            console.error("Error adding grocery item manually:", error);
            alert("An error occurred while adding the item.");
        }
    });


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
                console.log(data);
                updateTable(data.groceries);
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
                console.log("Grocery item added successfully");
            } else {
                console.error("Failed to add grocery item:", await response.text());
            }
        } catch (error) {
            console.error("Error adding grocery item:", error);
        }
    }


    // Display search results from Spoonacular API
    const displaySearchResults = (results) => {
        searchResults.innerHTML = ''; // Clear previous results
        results.forEach((result) => {
            const resultDiv = document.createElement('div');
            resultDiv.style.marginBottom = '20px';

            resultDiv.innerHTML = `
        <img src="https://spoonacular.com/cdn/ingredients_100x100/${result.image}" alt="${result.name}" style="width: 100px; height: 100px;" />
        <p>${result.name}</p>
        <button data-name="${result.name}">Add</button>
      `;

            // Add event listener to the "Add" button
            resultDiv.querySelector('button').addEventListener('click', () => {
                addToGroceries(result, 1);
            });

            searchResults.appendChild(resultDiv);
        });
    };

    // Search for grocery items using Spoonacular API
    searchButton.addEventListener('click', async(event) => {
        event.preventDefault();

        const term = searchBar.value;

        fetch('/findIngredients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ term: term })
            })
            .then(response => response.json())
            .then(data => {
                displaySearchResults(data);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    });

    // Update the table with grocery items
    const updateTable = (groceries) => {
        groceryTable.innerHTML = '';
        groceries.forEach(({ _id, name, amount }) => {
            const row = document.createElement('tr');
            row.innerHTML = `
        <td>${name}</td>
        <td>
          <input type="number" value="${amount}" min="1" data-id="${_id}" />
        </td>
        <td>
          <button data-id="${_id}" class="delete-button">Delete</button>
        </td>
      `;
            groceryTable.appendChild(row);
        });

        // Add event listeners for delete and update
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', () => {
                removeGrocery(button.dataset.id);
                console.log(button.dataset)
            });
        });

        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', async() => {
                const id = input.dataset.id;
                const amount = input.value;
                await fetch(`/groceries/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount })
                });
                loadGroceries();
            });
        });
    };

    // Remove grocery item
    const removeGrocery = async(id) => {
        await fetch(`/api/groceries/delete/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ owner: localStorage.getItem("uid") }) });
        loadGroceries();
    };

    // Clear the entire grocery list
    async function clearGroceryList() {
        let owner = localStorage.getItem("uid");
        console.log("Clearing groceries for UID:", owner);

        try {
            const response = await fetch(`/api/groceries/${owner}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log("Grocery list cleared");
                updateTable([]); // Clear the UI
            } else {
                console.error("Failed to clear groceries:", await response.text());
            }
        } catch (error) {
            console.error("Error clearing groceries:", error);
        }
    }


    // Event listener for "Shopped" button
    shoppedButton.addEventListener('click', clearGroceryList);

    // Initial load
    loadGroceries();
});