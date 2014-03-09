var _ = require('underscore');

module.exports = {
	// Takes 0 or more lists of validators. The first list contains the validators 
	// for the first argument, the second list the validators for the second 
	// argument, and so on. Returns an object with an `andCall` function to 
	// hookup the function called once validation passes. Meant to be used as such:
	//    `validate([isId], [isUser]).andCall(saveUser)`
	// assuming you have previously defined the validators isId and isUser and the
	// function saveUser (whichs takes an id and a user).
	validate: function (/* [arg1Validators], [arg2Va...] */) {
		var validators = _.map(arguments, 
			function (arg) { return _.isArray(arg) ? arg : [arg]; });
		// `andCall` is `check` with the validators partially applied 
		// (so only the function being wrapped is missing).
		var andCall = _.partial.apply(_, _.cat(check, validators));
		return { andCall: _.unary(andCall) };
	},

	// Validtors use the given condition to validate and store an error message.
	// The `message` is not added to the given `cond` function to avoid modifying it.
	validator: function(cond, message) {
		var f = function(/* args */) {
			return cond.apply(cond, arguments);
		};
		f['message'] = message;
		return f;
	}
};

// Called when all the needed information (validators and wrapped function)
// is known. Returns a wrapper function that validates the arguments and calls
// the wrapped function if validation passed. Throws an exception otherwise.
var check = function (/* arg1Validator(s), arg2Validator(s), ..., fun */) {
	// the first list of validators is for the first argument, the second list
	// for the second argument, etc.
	var indexedValidators = _.initial(arguments),
			fun = _.last(arguments);
	return function (/* [args] */) {
		// `[ [[validator0, validato1], arg0], [[validator2], arg1] ]`
		var validatorsArgPairs = _.zip(indexedValidators, arguments),
				indexedErrors = _.map(validatorsArgPairs, 
					function (validatorsArgPair) {
						var validators = _.flatten(_.first(validatorsArgPair)),
								arg = _.last(validatorsArgPair);
						return getArgErrors.apply(null, _.cat(validators, [arg])) });
		if (_.any(indexedErrors, _.complement(_.isEmpty)))
			throw new Error(makeErrorMessage(indexedErrors));
			
		return fun.apply(fun, arguments); // call wrapped function when no errors
	};
};

var getArgErrors = function (/* validator1, validator2, ..., arg  */) {
	var validators = _.initial(arguments),
			arg = _.last(arguments);
	return _.reduce(validators, function (errors, validator) {
		return !!validator && validator(arg) !== true ? 
									_.union([validator.message], errors)
									:  errors ;
	}, []);
};

var makeErrorMessage = function (indexedErrors) {
	// `indexedErrors` if of the form `[ ['error for arg 0', 'error for arg 0'], ['error for arg1'], ... ]`
	return _.reduce(indexedErrors, function(memo, argErrors, argIndex) {
		if (_.isEmpty(argErrors)) return memo;
		return  memo + '\n' + 'arg ' + argIndex + ' => ' + argErrors.join(', ');
	}, 'Arguments did not pass validation:');
};

var concat  = Array.prototype.concat;

_.mixin({
	complement: function(pred) {
		return function() {
			return !pred.apply(null, arguments);
		};
	},

	unary: function (fun) {
		return function unary (a) {
			return fun.call(this, a);
		};
	},

	cat: function() {
		return _.reduce(arguments, function(acc, elem) {
			if (_.isArguments(elem)) {
				return concat.call(acc, slice.call(elem));
			}
			else {
				return concat.call(acc, elem);
			}
		}, []);
	}
});

// #### TODO
// * Enhance with custom reporter