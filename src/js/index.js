import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader,clearLoader} from './views/base';

/** Global state of the app
- Search object
- Current recipe object
- Shopping list object
- Liked recipes
**/

const state = {};

/*Search Controller*/
const controlSearch = async() => {
	// 1. Get the query from the view
	const query = searchView.getInput(); 

	if (query) {
		// 2. Create search object and add to state
		state.search = new Search(query);

		// 3. Prepare UI for results ()
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try {
			// 4. Search for recipes;
			await state.search.getResults();
		
			// 5. Render results on UI
			clearLoader();
			searchView.renderResults(state.search.result);
		} catch(err) {
			alert(err);
			clearLoader();
		}
	}

};

elements.searchForm.addEventListener('submit',e=>{
	e.preventDefault();
	controlSearch();
});

elements.searchResPages.addEventListener('click',e=>{
	const btn = e.target.closest('.btn-inline');
	if (btn) {
		const gotoPage = parseInt(btn.dataset.goto,10); //base 10
		searchView.clearResults();
		searchView.renderResults(state.search.result,gotoPage);
	}
});

/*Recipe Controller*/
const controlRecipe = async () => {
	// get ID from URL
	const id = window.location.hash.replace('#','');

	if(id) {
		// prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		// Highlight selected search item
		if (state.search)searchView.highlightSelected(id);

		// Create New recipe object
		state.recipe = new Recipe(id);


		// Get recipe data and parse the ingredients
		try {
				await state.recipe.getRecipe();
				state.recipe.parseIngredients();
		
				// call the calcTime and serving functions
				state.recipe.calcTime();
				state.recipe.calcServings();
		
				// render the recipe
				clearLoader();
				recipeView.renderRecipe(
					state.recipe,
					state.likes.isLiked(id));
			} catch (err) {
				alert('Recipe was not retrieved');
				console.log(err);
			}

	}
} ;

// window.addEventListener('hashchange',controlRecipe);
// window.addEventListener('load',controlRecipe);
['hashchange','load'].forEach(event => window.addEventListener(event,controlRecipe));

/*List Controller*/
const controlList = () => {
	// Create a new list if there is no list yet
	if(!state.list) state.list = new List();

	// Add each ingredient to the list ad UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count,el.unit,el.ingredient);
		listView.renderItem(item);
	});
}

/*Handle delete and update list item events*/
elements.shopping.addEventListener('click',e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// Delete
	if (e.target.matches('.shopping__delete, .shopping__delete *')) {
		// Delete from State
		state.list.deleteItem(id);

		// Delete from UI
		listView.deleteItem(id);

	// Count Update 
	} else if (e.target.matches('.shopping__count-value')) {
		const val = parseFloat(e.target.value,10);
		state.list.updateCount(id,val);

		// UI doesn't need
	}
});


/*Likes Controller*/
const controlLike = () => {
	if (!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	// User has not yet liked current recipe 
	if (!state.likes.isLiked(currentID)) {
		// Add like to the data
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
			);

		// Toggle the like button
		likesView.toggleLikeBtn(true);

		// Add like to the UI List
		likesView.renderLike(newLike);

	// User liked current recipe
	} else {
		// Remove like from the data
		state.likes.deleteLike(currentID);

		// Toggle the like button
		likesView.toggleLikeBtn(false);

		// Remove like from the UI List
		likesView.deleteLike(currentID);

	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore Liked recipe on each load
window.addEventListener('load',()=>{
	state.likes = new Likes();
	state.likes.readStorage();
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// Render on Screen
	state.likes.likes.forEach((like)=>likesView.renderLike(like));
});

// Recipe Button Clicks
elements.recipe.addEventListener('click',e=>{
	if (e.target.matches('.btn-decrease, .btn-decrease *')) {
		// Decrease Button
		if (state.recipe.servings>1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	} else if (e.target.matches('.btn-increase, .btn-increase *')) {
		// Increase Button
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);

	} else if (e.target.matches('.recipe__btn--add,.recipe__btn--add *')) {
		controlList();
	} else if (e.target.matches('.recipe__love,.recipe__love *')) {
		// Like Controller
		controlLike();
	}
});