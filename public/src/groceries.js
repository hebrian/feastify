document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.getElementById("search-bar");
  const searchButton = document.getElementById("search-button");
  const searchResults = document.getElementById("search-results");
  const groceryTable = document.getElementById("grocery-table").querySelector("tbody");
  const shoppedButton = document.getElementById("shopped-button");

  const API_KEY = '9623bac1fe144fb1a5cf881f085f66d1';

  // Fetch grocery items from the server
  async function loadGroceries() {
    let owner = localStorage.getItem("uid");
    console.log("Loading groceries for UID:", owner);
  
    try {
      const response = await fetch(`/api/groceries/${owner}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.ok) {
        const groceries = await response.json();
        console.log("Groceries loaded:", groceries);
        updateTable(groceries); // Update the UI
      } else {
        console.error("Failed to load groceries:", await response.text());
      }
    } catch (error) {
      console.error("Error loading groceries:", error);
    }
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
      const response = await fetch('/api/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, ingredient }),
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
        addToGroceries(result.name, 1);
      });

      searchResults.appendChild(resultDiv);
    });
  };

  // Search for grocery items using Spoonacular API
  searchButton.addEventListener('click', async () => {
    const query = searchBar.value.trim();
    if (!query) return;

    const response = await fetch(
      `https://api.spoonacular.com/food/ingredients/search?query=${query}&apiKey=${API_KEY}`
    );
    const data = await response.json();
    displaySearchResults(data.results);
  });

  // Update the table with grocery items
  const updateTable = (groceries) => {
    groceryTable.innerHTML = '';
    groceries.forEach(({ id, name, amount }) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${name}</td>
        <td>
          <input type="number" value="${amount}" min="1" data-id="${id}" />
        </td>
        <td>
          <button data-id="${id}" class="delete-button">Delete</button>
        </td>
      `;
      groceryTable.appendChild(row);
    });

    // Add event listeners for delete and update
    document.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', () => removeGrocery(button.dataset.id));
    });

    document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('change', async () => {
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
  const removeGrocery = async (id) => {
    await fetch(`/api/groceries/${id}`, { method: 'DELETE' });
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
