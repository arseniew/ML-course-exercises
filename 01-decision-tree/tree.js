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

function decisionTree(data, columns, attributesColumns, resultColumn) {
  var labeledData = _.zipObject(columns, _.unzip(data));
  var targetEntropy = entropy(_.values(_.countBy(labeledData[resultColumn])));
  var result = {};

  var attributesFrequencyData = attributesFrequency(
    attributesColumns, resultColumn, labeledData
  );

  var attributesBranchesEntropy = _.mapValues(attributesFrequencyData, function(attr) {
    return _.mapValues(attr, function(branches) {
      var yes = branches.yes || 0;
      var no = branches.no || 0;
      return (yes + no) / data.length * entropy([yes, no])
    });
  });

  var attributesEntropy = _.mapValues(attributesBranchesEntropy, function(branches) {
    return _.sum(_.values(branches))
  });

  var attributesInformationGain = _.mapValues(attributesEntropy, function(branches) {
    return targetEntropy - branches;
  });

  var selectedAttribute = _.maxBy(_.toPairs(attributesInformationGain), 1)[0];
  var selectedAttributeColumnIndex = columns.indexOf(selectedAttribute);
  result[selectedAttribute] = _.mapValues(
    attributesBranchesEntropy[selectedAttribute], function(branchEntropy, branchKey) {
      if (branchEntropy === 0) {
        return attributesFrequencyData[selectedAttribute][branchKey].yes ? true : false;
      }
      return decisionTree(
        data.filter(function(row) {return row[selectedAttributeColumnIndex] === branchKey}),
        columns,
        attributesColumns,
        resultColumn
      );
    }
  );

  return result;
}

console.log(JSON.stringify(decisionTree(data, columns, attributesColumns, resultColumn), false, 2));
