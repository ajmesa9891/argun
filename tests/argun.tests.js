var should = require('should'),
		sinon = require('sinon'),
		_ = require('underscore'),
		a = require('../lib/argun');

var unchecked, uncheckedReturn, pred, isTrue, hasUser, hasCommand;

beforeEach(function () {
	uncheckedReturn = { it: 'has logic without arg validation' };
	unchecked = sinon.stub().returns(uncheckedReturn);
	// the predicate returns true when given true, false when given false
	pred = _.identity,
	isTrue = a.validator(_.identity, 'must be true'),
	hasUser = a.validator(
		function (o) { return typeof o.user != 'undefined'; }, 'must have a user property');
	hasCommand = a.validator(
		function (o) { return typeof o.command != 'undefined'; }, 'must have a command property');
	isString = a.validator(
		function (s) { return typeof s === 'string'; }, 'must be a string');
});

describe('Argun', function () {
	
	it('allows for no validation', function () {
		var checked = a.validate().andCall(unchecked);
		var result = checked(1, 2, 3);
		unchecked.calledOnce.should.be.true;
		unchecked.calledWith(1, 2, 3).should.be.true;
		result.should.equal(uncheckedReturn)
	});

	it('allows validating an argument', function () {
		var checked = a
			.validate([isTrue])
			.andCall(unchecked);
		checked(true).should.equal(uncheckedReturn);
		(function () {
			checked(false);
		}).should.throw();
	});

	it('reports when an argument is not valid', function () {
		var checked = a
			.validate([isTrue])
			.andCall(unchecked);
		(function () {
			checked(false);
		}).should.throw('Arguments did not pass validation:\narg 0 => must be true');
	});

	it('can chain multiple validators for a single argument', function () {
		var perform = a
			.validate([hasUser, hasCommand])
			.andCall(unchecked);

		perform({ command: 'bombard', user: 'knox'}).should.equal(uncheckedReturn);
		
		(function () {
			perform({ command: 'bombard' });
		}).should.throw('Arguments did not pass validation:\narg 0 => must have a user property');
		
		(function () {
			perform({ user: 'knox' });
		}).should.throw('Arguments did not pass validation:\narg 0 => must have a command property');
	});

	it('does not stop at the first error with chained validators', function () {
		var perform = a
			.validate([hasUser, hasCommand])
			.andCall(unchecked);

		(function () {
			perform({ flavor: 'chocolate' });
		}).should.throw('Arguments did not pass validation:\narg 0 => must have a command property, must have a user property');
	});

	it('validates multiple arguments', function () {
		var perform = a
			.validate([hasUser, hasCommand], [isTrue])
			.andCall(unchecked);

		perform({ command: 'bombard', user: 'knox'}, true)
			.should.equal(uncheckedReturn);

		(function () {
			perform({ command: 'bombard' }, true);
		}).should.throw('Arguments did not pass validation:\narg 0 => must have a user property');

		(function () {
			perform({ command: 'bombard', user: 'knox' });
		}).should.throw('Arguments did not pass validation:\narg 1 => must be true');

		(function () {
			perform({ command: 'bombard', user: 'knox' }, false);
		}).should.throw('Arguments did not pass validation:\narg 1 => must be true');

		(function () {
			perform('something', 'completely wrong');
		}).should.throw('Arguments did not pass validation:\narg 0 => must have a command property, must have a user property\narg 1 => must be true');
	});

	it('can skip validation for an argument', function() {
		var perform0 = a
			.validate([hasUser, hasCommand], null, [isTrue])
			.andCall(unchecked);
		var perform1 = a
			.validate([hasUser, hasCommand], [], [isTrue])
			.andCall(unchecked);

		perform0({ command: 'bombard', user: 'knox'}, 'irrelevant' , true)
			.should.equal(uncheckedReturn);
		perform1({ command: 'bombard', user: 'knox'}, 'irrelevant' , true)
			.should.equal(uncheckedReturn);

		(function () {
			perform0({ command: 'bombard', user: 'knox'}, 'irrelevant' , false)
		}).should.throw();
		(function () {
			perform1({ command: 'bombard', user: 'knox'}, 'irrelevant' , false)
		}).should.throw();
	});

	it('can be composed (chained validation)', function () {
		var isTrustedUser = a.validator(function (o) {
			return o.securityLevel >= 5;
		}, 'must have security level 5 or higher');

		var adminTask = a
			.validate([hasUser, hasCommand])
			.andCall(unchecked);
		var userTask = a
			.validate([isTrustedUser])
			.andCall(adminTask); // enhancing adminTask's validation!

		adminTask({ command: 'bombard', user: 'knox' }).should.equal(uncheckedReturn);

		(function () {
			userTask({ command: 'bombard', user: 'knox' })
		}).should.throw('Arguments did not pass validation:\narg 0 => must have security level 5 or higher');

		userTask({ command: 'bombard', user: 'knox', securityLevel: 5 })
			.should.equal(uncheckedReturn);
	});

	it('can handle array argumnets', function () {
		var isArray = a.validator(_.isArray, "must be an array");

		var checked = a
			.validate([isArray])
			.andCall(unchecked);

		checked([5, 6]).should.equal(uncheckedReturn);
	});
});

describe('A validator', function() {

	var trueCondition = function () { return true; };
	var falseCondition = function () { return false; };
	var simpleValidator = a.validator(trueCondition, 'the error message');

	it('should be a function', function () {
		simpleValidator.should.be.type('function');
	});

	it('should have a message', function () {
		simpleValidator.should.have.property('message', 'the error message');
	});

	it('should pass all argumnets to the validating function', function () {
		var condition = sinon.spy();
		var validator = a.validator(condition, 'the error message');
		validator('pistachio', ['ice', 'cream']);
		condition.calledOnce.should.be.true;
		condition.calledWith('pistachio', ['ice', 'cream']).should.be.true;
	});

	it('should return the validator function\'s response', function() {
		var trueCondition = sinon.stub().returns(true),
				falseCondition = sinon.stub().returns(false),
				trueValidator = a.validator(trueCondition, 'never'),
				falseValidator = a.validator(falseCondition, 'ever');
		trueValidator().should.be.a.Boolean.and.be.true;
		falseValidator().should.be.a.Boolean.and.be.false;
	});
});