let angular = require('angular');
let expect = require('expect.js');
let ngMock = require('ngMock');

// Load the kibana app dependencies.
require('ui/directives/validate_json');

let $parentScope;
let $elemScope;
let $elem;
let mockScope = '';

let input = {
  valid: '{ "test": "json input" }',
  invalid: 'strings are not json'
};

let markup = {
  textarea: '<textarea ng-model="mockModel" validate-json></textarea>',
  input: '<input type="text" ng-model="mockModel" validate-json>'
};

let init = function (type) {
  // Load the application
  ngMock.module('kibana');
  type = type || 'input';
  let elMarkup = markup[type];

  // Create the scope
  ngMock.inject(function ($injector, $rootScope, $compile) {
    // Give us a scope
    $parentScope = $rootScope;
    $parentScope.mockModel = mockScope;

    $elem = angular.element(elMarkup);
    $compile($elem)($parentScope);
    $elemScope = $elem.isolateScope();
  });
};

describe('validate-json directive', function () {
  let checkValid = function (inputVal, className) {
    $parentScope.mockModel = inputVal;
    $elem.scope().$digest();
    expect($elem.hasClass(className)).to.be(true);
  };

  describe('initialization', function () {
    beforeEach(function () {
      init();
    });

    it('should use the model', function () {
      expect($elemScope).to.have.property('ngModel');
    });

  });

  Object.keys(markup).forEach(function (inputType) {
    describe(inputType, function () {
      beforeEach(function () {
        init(inputType);
      });

      it('should be an input', function () {
        expect($elem.get(0).tagName).to.be(inputType.toUpperCase());
      });

      it('should set valid state', function () {
        checkValid(input.valid, 'ng-valid');
      });

      it('should be valid when empty', function () {
        checkValid('', 'ng-valid');
      });

      it('should set invalid state', function () {
        checkValid(input.invalid, 'ng-invalid');
      });

      it('should update validity on changes', function () {
        checkValid(input.valid, 'ng-valid');
        checkValid(input.invalid, 'ng-invalid');
        checkValid(input.valid, 'ng-valid');
      });
    });
  });
});
