var fs = require('fs');
var _ = require('lodash');
var rawData = fs.readFileSync('./data', 'utf-8');

var indexColumn = 'index';
var resultColumn = 'play';
var columns = [indexColumn, 'outlook', 'temperature', 'humidity', 'wind', resultColumn];
var attributesColumns = _.without(columns, indexColumn, resultColumn);

function attributesFrequency(attributesColumns, resultColumn, labeledData) {
  return _.zipObject(
    attributesColumns,
    _.map(attributesColumns, function(columnKey) {
      return _.mapValues(
        _.groupBy(_.zip(labeledData[columnKey], labeledData[resultColumn]), 0),
        _.partial(_.countBy, _, 1)
      )
    })
  );
}

function entropy(probs) {
  var total = _.sum(probs);
  return _.reduce(probs, function(ent, prob) {
    var probRate = prob / total;
    var frag = - probRate * Math.log2(probRate);
    return ent + (frag || 0)
  }, 0)
}

var data = _(rawData)
    .split('\n')
    .compact()
    .map(_.partial(_.split, _, ' ', -1))
    .value()
var labeledData = _.zipObject(columns, _.unzip(data));

console.log(
  _.mapValues(
    _.groupBy(_.zip(labeledData['outlook'], labeledData[resultColumn]), 0),
    _.partial(_.countBy, _, 1)
  )
)
