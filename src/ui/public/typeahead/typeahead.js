define(function (require) {
  let _ = require('lodash');
  let typeahead = require('ui/modules').get('kibana/typeahead');

  require('ui/typeahead/typeahead.less');
  require('ui/typeahead/_input');
  require('ui/typeahead/_items');

  typeahead.directive('kbnTypeahead', function () {
    let keyMap = {
      ESC: 27,
      UP: 38,
      DOWN: 40,
      TAB: 9,
      ENTER: 13
    };

    return {
      restrict: 'A',
      scope: {
        historyKey: '@kbnTypeahead'
      },
      controllerAs: 'typeahead',

      controller: function ($rootScope, $scope, $element, $timeout, PersistedLog, config) {
        let self = this;
        self.form = $element.closest('form');
        self.query = '';
        self.hidden = true;
        self.focused = false;
        self.mousedOver = false;

        // instantiate history and add items to the scope
        self.history = new PersistedLog('typeahead:' + $scope.historyKey, {
          maxLength: config.get('history:limit'),
          filterDuplicates: true
        });

        $scope.items = self.history.get();
        $scope.filteredItems = [];

        self.setInputModel = function (model) {
          $scope.inputModel = model;

          // watch for changes to the query parameter, delegate to typeaheadCtrl
          $scope.$watch('inputModel.$viewValue', self.filterItemsByQuery);
        };

        self.setHidden = function (hidden) {
          self.hidden = !!(hidden);
        };

        self.setFocused = function (focused) {
          self.focused = !!(focused);
        };

        self.setMouseover = function (mousedOver) {
          self.mousedOver = !!(mousedOver);
        };

        // activation methods
        self.activateItem = function (item) {
          self.active = item;
        };

        self.getActiveIndex = function () {
          if (!self.active) {
            return;
          }

          return $scope.filteredItems.indexOf(self.active);
        };

        self.getItems = function () {
          return $scope.filteredItems;
        };

        self.activateNext = function () {
          let index = self.getActiveIndex();
          if (index == null) {
            index = 0;
          } else if (index < $scope.filteredItems.length - 1) {
            ++index;
          }

          self.activateItem($scope.filteredItems[index]);
        };

        self.activatePrev = function () {
          let index = self.getActiveIndex();

          if (index > 0 && index != null) {
            --index;
          } else if (index === 0) {
            self.active = false;
            return;
          }

          self.activateItem($scope.filteredItems[index]);
        };

        self.isActive = function (item) {
          return item === self.active;
        };

        // selection methods
        self.selectItem = function (item, ev) {
          self.hidden = true;
          self.active = false;
          $scope.inputModel.$setViewValue(item);
          $scope.inputModel.$render();
          self.persistEntry();

          if (ev && ev.type === 'click') {
            // kibi: https://github.com/sirensolutions/kibi-internal/commit/0e4abf96933de5e854bc2534e8a71e2c6023d9f3
            // corrected click logic for typeahead
            $rootScope.$emit('kibi:dashboard:invoke-method', 'filterResults');
            $timeout(function () {
              self.submitForm();
            });
          }
        };

        self.submitForm = function () {
          if (self.form.length) {
            self.form.submit();
          }
        };

        self.persistEntry = function () {
          if ($scope.inputModel.$viewValue.length) {
            // push selection into the history
            $scope.items = self.history.add($scope.inputModel.$viewValue);
          }
        };

        self.selectActive = function () {
          if (self.active) {
            self.selectItem(self.active);
          }
        };

        self.keypressHandler = function (ev) {
          let keyCode = ev.which || ev.keyCode;

          if (self.focused) {
            self.hidden = false;
          }

          // hide on escape
          if (_.contains([keyMap.ESC], keyCode)) {
            self.hidden = true;
            self.active = false;
          }

          // change selection with arrow up/down
          // on down key, attempt to load all items if none are loaded
          if (_.contains([keyMap.DOWN], keyCode) && $scope.filteredItems.length === 0) {
            $scope.filteredItems = $scope.items;
            $scope.$digest();
          } else if (_.contains([keyMap.UP, keyMap.DOWN], keyCode)) {
            if (self.isVisible() && $scope.filteredItems.length) {
              ev.preventDefault();

              if (keyCode === keyMap.DOWN) {
                self.activateNext();
              } else {
                self.activatePrev();
              }
            }
          }

          // persist selection on enter, when not selecting from the list
          if (_.contains([keyMap.ENTER], keyCode)) {
            if (!self.active) {
              self.persistEntry();
            }
          }

          // select on enter or tab
          if (_.contains([keyMap.ENTER, keyMap.TAB], keyCode)) {
            self.selectActive();
            self.hidden = true;
          }
        };

        self.filterItemsByQuery = function (query) {
          // cache query so we can call it again if needed
          if (query) {
            self.query = query;
          }

          // if the query is empty, clear the list items
          if (!self.query.length) {
            $scope.filteredItems = [];
            return;
          }

          // update the filteredItems using the query
          let beginningMatches = $scope.items.filter(function (item) {
            return item.indexOf(query) === 0;
          });

          let otherMatches = $scope.items.filter(function (item) {
            return item.indexOf(query) > 0;
          });

          $scope.filteredItems = beginningMatches.concat(otherMatches);
        };

        self.isVisible = function () {
          return !self.hidden && ($scope.filteredItems.length > 0) && (self.focused || self.mousedOver);
        };

        // handle updates to parent scope history
        $scope.$watch('items', function (items) {
          if (self.query) {
            self.filterItemsByQuery(self.query);
          }
        });

        // watch for changes to the filtered item list
        $scope.$watch('filteredItems', function (filteredItems) {

          // if list is empty, or active item is missing, unset active item
          if (!filteredItems.length || !_.contains(filteredItems, self.active)) {
            self.active = false;
          }
        });
      },

      link: function ($scope, $el, attr) {
        // should be defined via setInput() method
        if (!$scope.inputModel) {
          throw new Error('kbn-typeahead-input must be defined');
        }

        $scope.$watch('typeahead.isVisible()', function (vis) {
          $el.toggleClass('visible', vis);
        });
      }
    };
  });
});
