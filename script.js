// --- PATH CONSTANTS --- 
// This tells our code how to find other folders depending on what page we are currently looking at.
const isPagesDir = window.location.pathname.includes('/pages/');
const rootPath = isPagesDir ? '../' : './';
const phpPath = rootPath + 'php/';
const pagesPath = isPagesDir ? './' : 'pages/';

// --- GLOBAL FUNCTIONS ---

// This function creates new HTML elements out of thin air! It is triggered when you click "+ Add another ingredient"
window.addDynamicField = function(containerId, inputName, placeholder, isTextarea = false, inputType = 'text', value = '') {
    // Find the exact box on the page where we want to add the new input field
    const container = document.getElementById(containerId);
    // Create a brand new, empty <div> tag in the browser's memory
    const row = document.createElement('div');
    row.className = 'dynamic-row';
    
    let dragHandle = '';
    if(inputName === 'ingredients[]' || inputName === 'steps[]') {
        // Add a little drag icon for ingredients and steps
        dragHandle = `<span class="drag-handle" title="Drag to reorder">☰</span>`;
    }

    // Safely escape the value to prevent quote breaking
    const safeValue = value.replace(/"/g, '&quot;');

    let inputElement = isTextarea 
        ? `<textarea name="${inputName}" placeholder="${placeholder}" rows="2" required>${safeValue}</textarea>`
        : `<input type="${inputType}" name="${inputName}" placeholder="${placeholder}" value="${safeValue}" ${inputName !== 'pictures[]' && inputName !== 'tags[]' ? 'required' : ''}>`;
    
    // Fill our empty <div> with the HTML for the input box and a "Remove" button
    row.innerHTML = `
        ${dragHandle}
        ${inputElement}
        <button type="button" class="remove-btn" onclick="this.parentElement.remove()">Remove</button>
    `;
    // Finally, stick our newly built row onto the actual webpage so the user can see it!
    container.appendChild(row);
};

// Handle deleting a recipe
window.deleteRecipe = async function(id) {
    // Pop up a browser confirmation box. If they click "Cancel", it skips the deletion.
    if (confirm("Are you sure? You won't be able to revert this!")) {
        try {
            // Will point to your PHP deletion script later (e.g., delete_recipe.php?id=...)
            const response = await fetch(`${phpPath}delete_recipe.php?id=${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            
            if (data.success || data.deletedCount > 0) {
                alert("Recipe deleted successfully!");
                // Refresh the page automatically so the deleted recipe disappears from the screen
                window.location.reload(); // Reload the page to reflect changes
            } else {
                alert("Failed to delete recipe.");
            }
        } catch (error) {
            console.error("Error deleting recipe:", error);
            alert("Could not delete. Backend script may not be connected yet.");
        }
    }
};

// --- PAGE LOGIC ---
// "DOMContentLoaded" means: Wait until the whole HTML page is loaded before trying to run this code!
document.addEventListener("DOMContentLoaded", () => {
    
    // --- AUTHENTICATION STATE CHECK ---
    // This function asks the PHP server: "Hey, is anyone currently logged in?"
    const checkAuth = async () => {
        try {
            const res = await fetch(`${phpPath}check_auth.php`);
            const data = await res.json();
            const authLink = document.getElementById('auth-link');
            
            const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html');
            const isProtectedPage = window.location.pathname.includes('create.html') || window.location.pathname.includes('update.html');

            if (data.logged_in) {
                if (authLink) {
                    authLink.textContent = `Logout (${data.username})`;
                    authLink.href = `${phpPath}logout.php`;
                }
                if (isAuthPage) window.location.href = `${rootPath}index.html`; // Can't login if already logged in
            } else {
                if (authLink && !isAuthPage) {
                    authLink.textContent = 'Login';
                    authLink.href = `${pagesPath}login.html`;
                }
                if (isProtectedPage) {
                    alert('Please log in to manage recipes!');
                    window.location.href = `${pagesPath}login.html`;
                }
            }
        } catch (e) { console.error('Auth check failed', e); }
    };
    checkAuth(); // Run immediately on every page load

    // 1. CREATE RECIPE LOGIC (Runs only on create.html)
    const createForm = document.getElementById('create-recipe-form');
    if (createForm) {
        // We listen for the user to click the "Submit" button...
        createForm.addEventListener('submit', async (e) => {
            // 'preventDefault' stops the browser from reloading the page, which is the default 1990s form behavior
            e.preventDefault();
            const formData = new FormData(createForm);
            
            // Helper function to extract array data and filter out empty strings
            const getArrayData = (name) => {
                return formData.getAll(name).map(item => item.trim()).filter(item => item !== '');
            };

            // We pack all the form answers into a neat JavaScript "Object"
            const newRecipe = {
                title: formData.get('title'),
                ingredients: getArrayData('ingredients[]'),
                steps: getArrayData('steps[]'),
                pictures: getArrayData('pictures[]'),
                tags: getArrayData('tags[]')
            };

            try {
                // We "fetch" (send) this data to our PHP server so it can be saved in the database
                const response = await fetch(`${phpPath}save_recipe.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRecipe)
                });
                
                // We wait for the server's reply. If it succeeded, we redirect them to the home page!
                const textData = await response.text(); // Read raw response first
                try {
                    const data = JSON.parse(textData);
                    if(data.success || data.insertedId) {
                        alert("Recipe added successfully!");
                        createForm.reset();
                        window.location.href = `${rootPath}index.html`; // Redirect to home so you see it!
                    } else {
                        alert("Failed to add recipe: " + data.message);
                    }
                } catch (e) {
                    console.error("Backend error:", textData);
                    alert("Server Error! PHP said:\n\n" + textData.substring(0, 150));
                }
            } catch (error) {
                console.error("Error saving recipe:", error);
                alert("Network error! Make sure you are using http://localhost/ritu/ and XAMPP is running.");
            }
        });
    }

    // --- 2. UPDATE RECIPE LOGIC (Runs only on update.html) ---
    const updateForm = document.getElementById('update-recipe-form');
    if (updateForm) {
        // Look at the web address (URL) and grab the '?id=...' part so we know WHICH recipe to update
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');

        // Fetch existing recipe data and pre-fill the form
        if (recipeId) {
            fetch(`${phpPath}get_recipe.php?id=${recipeId}`)
                .then(res => res.json())
                .then(recipe => {
                    if (recipe.error) {
                        alert(recipe.error);
                        window.location.href = `${rootPath}index.html`;
                        return;
                    }
                    
                    // Fill in the title box with the existing title
                    document.getElementById('title').value = recipe.title || '';

                    // Helper to pre-fill dynamic arrays
                    const populateContainer = (containerId, name, placeholder, isTextarea, type, dataArray) => {
                        if (dataArray && dataArray.length > 0) {
                            // For every item in the database array, generate a new row on the screen
                            dataArray.forEach(val => window.addDynamicField(containerId, name, placeholder, isTextarea, type, val));
                        } else {
                            window.addDynamicField(containerId, name, placeholder, isTextarea, type, ''); // Add one empty row fallback
                        }
                    };

                    populateContainer('ingredients-container', 'ingredients[]', 'e.g., 2 cups of all-purpose flour', false, 'text', recipe.ingredients);
                    populateContainer('steps-container', 'steps[]', 'Step 1', true, 'text', recipe.steps);
                    populateContainer('pictures-container', 'pictures[]', 'e.g., https://example.com/image.jpg', false, 'url', recipe.pictures);
                    populateContainer('tags-container', 'tags[]', 'e.g., Easy Recipe, Diet, Cheat meal', false, 'text', recipe.tags);
                })
                .catch(err => console.error("Error fetching recipe:", err));
        }

        // Handle saving the updated data
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(updateForm);
            const getArrayData = (name) => formData.getAll(name).map(item => item.trim()).filter(item => item !== '');

            const updatedRecipe = {
                id: recipeId,
                title: formData.get('title'),
                ingredients: getArrayData('ingredients[]'),
                steps: getArrayData('steps[]'),
                pictures: getArrayData('pictures[]'),
                tags: getArrayData('tags[]')
            };

            try {
                const response = await fetch(`${phpPath}update_recipe.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedRecipe)
                });
                const data = await response.json();
                if(data.success) {
                    alert("Recipe updated successfully!");
                    window.location.href = `${rootPath}index.html`; // Send back to home view
                } else alert("Failed to update recipe.");
            } catch (error) {
                console.error("Error updating recipe:", error);
            }
        });
    }

    // --- 3. FETCH RECIPES LOGIC (Runs only on index.html) ---
    const recipeContainer = document.getElementById('recipe-container');
    if (recipeContainer) {
        const fetchRecipes = async () => {
            try {
                // Fetch from your PHP backend (e.g., get_recipes.php)
                const response = await fetch(`${phpPath}get_recipes.php`);
                const data = await response.json();
                const recipes = Array.isArray(data) ? data : (data.recipes || []);

                recipeContainer.innerHTML = ''; // Clear default text

                if (recipes.length > 0) {
                    // Loop through every single recipe we got back from the PHP server
                    recipes.forEach(recipe => {
                        // Map properties exactly like your React RecipeCard.jsx
                        // If they didn't provide a picture, use a beautiful default food image from Unsplash
                        const imageUrl = recipe.pictures && recipe.pictures.length > 0 ? recipe.pictures[0] : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800&auto=format&fit=crop';
                        
                        let tagsHtml = '';
                        if (recipe.tags && recipe.tags.length > 0) {
                            const visibleTags = recipe.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('');
                            const extraTags = recipe.tags.length > 3 ? `<span class="tag-more">+${recipe.tags.length - 3}</span>` : '';
                            tagsHtml = `<div class="tags-container">${visibleTags}${extraTags}</div>`;
                        }

                        const recipeId = recipe.id || recipe._id; 
                        // Build the HTML for the recipe card using the data we just formatted
                        const cardHtml = `
                            <div class="recipe-card">
                                <a href="${pagesPath}details.html?id=${recipeId}" class="card-link">
                                    <div class="card-image-container"><img src="${imageUrl}" alt="${recipe.title}" class="card-image"></div>
                                    <div class="card-content">
                                        <h3 class="card-title">${recipe.title}</h3>
                                        ${tagsHtml}
                                        <div class="card-stats"><span><span class="emoji">🛒</span> ${(recipe.ingredients && recipe.ingredients.length) || 0} Ingredients</span><span><span class="emoji">📝</span> ${(recipe.steps && recipe.steps.length) || 0} Steps</span></div>
                                    </div>
                                </a>
                                <div class="card-actions"><a href="${pagesPath}update.html?id=${recipeId}" class="btn-update">Update</a><button class="btn-delete" onclick="deleteRecipe('${recipeId}')">Delete</button></div>
                            </div>
                        `;
                        // Inject the built card into the grid container on the homepage
                        recipeContainer.insertAdjacentHTML('beforeend', cardHtml);
                    });
                } else {
                    // Show this if they have 0 recipes, or if they aren't logged in
                    recipeContainer.innerHTML = '<p>No recipes found. Please log in or click "Create Recipe" to add your first one!</p>';
                }
            } catch (error) {
                console.error("Error fetching recipes:", error);
            }
        };
        fetchRecipes();
    }

    // --- 4. RECIPE DETAILS LOGIC (Runs only on details.html) ---
    const detailsContainer = document.getElementById('recipe-details-container');
    if (detailsContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const recipeId = urlParams.get('id');

        if (recipeId) {
            fetch(`${phpPath}get_recipe.php?id=${recipeId}`)
                .then(res => res.json())
                .then(recipe => {
                    if (recipe.error) {
                        detailsContainer.innerHTML = `<p class="error-msg">${recipe.error}</p>`;
                        return;
                    }

                    // Setup Picture Slider Logic
                    const displayPictures = recipe.pictures && recipe.pictures.length > 0 
                        ? recipe.pictures 
                        : ['https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=2626&auto=format&fit=crop'];
                    
                    let currentIndex = 0;
                    
                    // This function handles swapping the large image when the user clicks next/prev
                    window.updateSlider = () => {
                        document.getElementById('slider-image').src = displayPictures[currentIndex];
                        document.querySelectorAll('.slider-dot').forEach((dot, idx) => {
                            // Highlight the correct dot at the bottom of the image
                            dot.className = `slider-dot ${idx === currentIndex ? 'active' : ''}`;
                        });
                    };
                    window.nextImage = () => { currentIndex = (currentIndex + 1) % displayPictures.length; updateSlider(); };
                    window.prevImage = () => { currentIndex = (currentIndex === 0 ? displayPictures.length - 1 : currentIndex - 1); updateSlider(); };
                    window.goToImage = (idx) => { currentIndex = idx; updateSlider(); };

                    // Generate HTML lists for tags, ingredients, and steps by "mapping" over the arrays
                    const tagsHtml = (recipe.tags && recipe.tags.length > 0) ? `<div class="detail-tags-container">${recipe.tags.map(tag => `<span class="detail-tag">${tag}</span>`).join('')}</div>` : '';
                    const ingredientsHtml = (recipe.ingredients && recipe.ingredients.length > 0) ? recipe.ingredients.map(ing => `<li class="ingredient-item"><span class="bullet">•</span><span>${ing}</span></li>`).join('') : '';
                    const stepsHtml = (recipe.steps && recipe.steps.length > 0) ? recipe.steps.map((step, idx) => `<div class="step-item"><div class="step-number">${idx + 1}</div><p class="step-text">${step}</p></div>`).join('') : '';
                    
                    let sliderControls = '';
                    if (displayPictures.length > 1) {
                        const dots = displayPictures.map((_, idx) => `<button class="slider-dot ${idx === 0 ? 'active' : ''}" onclick="goToImage(${idx})"></button>`).join('');
                        sliderControls = `<button class="slider-btn prev" onclick="prevImage()">❮</button><button class="slider-btn next" onclick="nextImage()">❯</button><div class="slider-dots">${dots}</div>`;
                    }

                    detailsContainer.innerHTML = `
                        <a href="${rootPath}index.html" class="back-link">← Back to Recipe Book</a>
                        <div class="details-card">
                            <div class="hero-slider">
                                <img id="slider-image" src="${displayPictures[0]}" alt="${recipe.title}">
                                <div class="hero-overlay"></div>
                                ${sliderControls}
                                <div class="hero-title-container">
                                    <h1 class="hero-title">${recipe.title}</h1>
                                </div>
                            </div>
                            <div class="details-content">
                                ${tagsHtml}
                                <div class="details-grid">
                                    <div class="ingredients-col">
                                        <h2><span class="emoji">🛒</span> Ingredients</h2>
                                        <ul class="ingredients-list">${ingredientsHtml}</ul>
                                    </div>
                                    <div class="steps-col">
                                        <h2><span class="emoji">🧑‍🍳</span> Instructions</h2>
                                        <div class="steps-list">${stepsHtml}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                })
                .catch(err => {
                    console.error("Error fetching recipe:", err);
                    detailsContainer.innerHTML = `<p>Error loading recipe.</p>`;
                });
        } else {
            detailsContainer.innerHTML = `<p>No recipe ID provided.</p>`;
        }
    }

    // --- 5. LOGIN & REGISTER LOGIC ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // FormData automatically grabs all the input fields from the form so we don't have to get them one by one
            const formData = new FormData(loginForm);
            try {
                const res = await fetch(`${phpPath}login_action.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Convert the FormData into a neat JSON object to send to the server
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                const data = await res.json();
                if (data.success) {
                    window.location.href = `${rootPath}index.html`;
                } else alert(data.message);
            } catch (err) { console.error(err); }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            try {
                const res = await fetch(`${phpPath}register_action.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(formData))
                });
                const data = await res.json();
                if (data.success) {
                    alert("Account created! Welcome!");
                    window.location.href = `${rootPath}index.html`;
                } else alert(data.message);
            } catch (err) { console.error(err); }
        });
    }
});