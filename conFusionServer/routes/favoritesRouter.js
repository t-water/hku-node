const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate')
const cors = require('./cors');

const Favorites = require('../models/favorite')

const favoritesRouter = express.Router();
favoritesRouter.use(bodyParser.json())

favoritesRouter.route('/')
.get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
	Favorites.findOne({user: req.user._id})
	.then(favorite =>{
		if(favorite != null){
			Favorites.findById(favorite._id)
			.populate('user')
			.populate('dishes')
			.then((favorite) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(favorite);
			}, (err) => next(err))
			.catch((err) => next(err));
		}else{
			err = new Error("No favorites exist for this user");
			err.status = 404;
			return next(err);
		}
	}, (err) => next(err))
	.catch((err) => next(err))
	
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
	Favorites.findOne({user: req.user._id})
	.then(favorite => {
		if(favorite != null){
			let dishes = req.body.map(dish => dish._id)
			favorite.dishes = favorite.dishes.concat(dishes.filter(dish => favorite.dishes.indexOf(dish) === -1))
			favorite.save()
			.then(favorite => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(favorite);
			}, (err) => next(err))
			.catch((err) => next(err))
		}else{
			Favorites.create({user: req.user._id, dishes: req.body.map(dish => dish._id)})
			.then(favorite => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(favorite);
			}, (err) => next(err))
			.catch((err) => next(err))
		}
	}, (err) => next(err))
	.catch((err) => next(err))
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
	Favorites.findOne({user: req.user._id})
	.then(favorite => {
		if(favorite != null){
			favorite.remove()
			.then(favorite => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.send("Favorites removed successfully");
			}, (err) => next(err))
			.catch((err) => next(err))
		}else{
			err = new Error("No favorites exist for this user");
			err.status = 404;
			return next(err);
		}
		
	}, (err) => next(err))
	.catch((err) => next(err))
})

favoritesRouter.route('/:dishId')
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
	Favorites.findOne({user: req.user._id})
	.then((favorite) => {
		if(favorite != null){
			if(favorite.dishes.indexOf(req.params.dishId) === -1){
				favorite.dishes.push(req.params.dishId)
				favorite.save()
				.then((favorite) => {
					res.statusCode = 200;
    				res.setHeader('Content-Type', 'application/json');
    				res.json(favorite);
				}, (err) => next(err))
				.catch((err) => next(err));
			}else{
				err = new Error('Dish with id: ' + req.params.dishId + ' already exists in favorites')
				err.status = 403;
				return next(err)
			}
		}else{
			Favorites.create({user: req.user._id, dishes: [req.params.dishId]})
			.then((favorite) =>{
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(favorite)
			}, (err) => next(err))
		    .catch((err) => next(err))
		}
	}, (err) => next(err))
	.catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) =>{
	Favorites.findOne({user: req.user._id})
	.then(favorite => {
		if(favorite != null){
			if(favorite.dishes.indexOf(req.params.dishId) !== -1){
				favorite.dishes.remove(req.params.dishId)
				favorite.save()
				.then(favorite => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(favorite)
				}, (err) => next(err))
				.catch((err) => next(err))
			}else{
				err = new Error("Dish does not exist in this user's favorites");
				err.status = 404;
				return next(err)
			}
		}else{
			err = new Error("No favorites exist for this user");
			err.status = 404;
			return next(err);
		}
	}, (err) => next(err))
	.catch((err) => next(err))
})

module.exports = favoritesRouter;