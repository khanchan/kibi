describe('tooltipFormatter', function () {
  let _ = require('lodash');
  let $ = require('jquery');
  let expect = require('expect.js');
  let ngMock = require('ngMock');

  let tooltipFormatter;

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (Private) {
    tooltipFormatter = Private(require('ui/agg_response/point_series/_tooltip_formatter'));
  }));

  function agg(name) {
    return {
      fieldFormatter: _.constant(function (v) { return '(' + v + ')'; }),
      makeLabel: _.constant(name)
    };
  }

  function cell($row, i) {
    return $row.eq(i).text().trim();
  }

  let baseEvent = {
    datum: {
      aggConfigResult: {
        aggConfig: agg('inner'),
        value: 3,
        $parent: {
          aggConfig: agg('middle'),
          value: 2,
          $parent: {
            aggConfig: agg('top'),
            value: 1
          }
        }
      },
      extraMetrics: []
    }
  };

  it('returns html based on the mouse event', function () {
    let event = _.cloneDeep(baseEvent);
    let $el = $(tooltipFormatter(event));
    let $rows = $el.find('tr');
    expect($rows.size()).to.be(3);

    let $row1 = $rows.eq(0).find('td');
    expect(cell($row1, 0)).to.be('inner');
    expect(cell($row1, 1)).to.be('(3)');

    let $row2 = $rows.eq(1).find('td');
    expect(cell($row2, 0)).to.be('middle');
    expect(cell($row2, 1)).to.be('(2)');

    let $row3 = $rows.eq(2).find('td');
    expect(cell($row3, 0)).to.be('top');
    expect(cell($row3, 1)).to.be('(1)');
  });
});
