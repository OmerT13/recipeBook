import axios from 'axios';

export default class Recipe {
	constructor(id) {
		this.id = id;
	}

	async getRecipe() {
		try {
			const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
			this.title = res.data.recipe.title;
			this.author = res.data.recipe.publisher;
			this.img = res.data.recipe.image_url;
			this.url = res.data.recipe.source_url;
			this.ingredients = res.data.recipe.ingredients;
		} catch (error) {
			alert(error);
		}
	}

	calcTime() {
		// for every 3 ingredients we need 15 minutes
		const numIng = this.ingredients.length;
		const periods = Math.ceil(numIng/13);
		this.time = periods*15;
	}

	calcServings() {
		// depends how we calculate it, for now we will make it 4
		this.servings = 4;
	}

	parseIngredients() {
		const unitsLong = ['tablespoons','tablespoon','ounces','ounce','teaspoons','teaspoon','cups','pounds'];
		const unitsShort = ['tbsp','tbsp','oz','oz','tsp','tsp','cup','pound'];
		const units = [...unitsShort,'kg','g'];

		const newIngredients = this.ingredients.map(el => {

			// 1- Uniform units
			let ingredient = el.toLowerCase();
			unitsLong.forEach((unit,i)=> {
				ingredient = ingredient.replace(unit,unitsShort[i]);
			});

			// 2- Remove parenthesis
			ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');

			// 3- Parse ingredients into count, unit, and ingredient
			const arrIngr = ingredient.split(' ');
			const unitIndex = arrIngr.findIndex(el2=>units.includes(el2));

			let objIng;
			if (unitIndex>-1) {
				// There is a unit
				// Need to deal with multiple scenarios
				// 4 1/2 cups
				// 2 cups
				const arrCount = arrIngr.slice(0,unitIndex);
				let count;
				if(arrCount.length===1) {
					// need to deal with cases where a dash is used
					// 1-1/2 cups
					count = eval(arrIngr[0].replace('-','+'));
				} else {
					count = eval(arrIngr.slice(0,unitIndex).join('+'));
				}

				objIng = {
					count,
					unit:arrIngr[unitIndex],
					ingredient:arrIngr.slice(unitIndex+1).join(' '),
				}
			} else if (parseInt(arrIngr[0],10)){
				// No unit, but 1st element is a number
				objIng = {
					count:parseInt(arrIngr[0],10),
					unit: '',
					ingredient: arrIngr.slice(1).join(' '),
				};
			}else if (unitIndex===-1) {
				// No Unit, 1st element also not a number
				objIng = {
					count:1,
					unit:'',
					ingredient
				};
			}

			return objIng;

		});

		this.ingredients = newIngredients;
	};

	updateServings (type) {
		// Servings
		const newServings = type ==='dec'? this.servings - 1:this.servings + 1;

		// Ingredients
		this.ingredients.forEach(ing=>ing.count*=(newServings/this.servings));

		this.servings = newServings;
	};
}





