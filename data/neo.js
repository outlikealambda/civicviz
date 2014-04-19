var neo = require('node-neo4j');

var 
  db = new neo('http://localhost:7474'),
  queries = {};

queries.getCommittee = function (name) {
  return 'match (c) where c.name = "Carlisle for Mayor" return c';
};

function queryDb(queryString, cb) {
  db.cypherQuery(queryString, function(err, result) {
    cb(result);
  });
};

queries.getHedgers = function() {
  return 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = "Governor" and d.in = "2008-2010" and r.in = d.in with donor, count(distinct c) as hedges order by hedges where hedges > 1 with donor match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where d.in = "2008-2010" and r.in = d.in and o.title = "Governor" with donor, c, count(d) as donations, sum(d.amount) as total order by donor.lastName return donor, c, donations, total';
};

queries.getAllDonors = function() {
  return 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = "Governor" and d.in = "2008-2010" and r.in = d.in with donor, c, count(d) as donations, sum(d.amount) as total order by donor.lastName return donor, c, donations, total';
};

queries.getAvailableRaces = function() {
  return 'match (o:Office)-[r:`ran for`]-(c) with distinct r.in as period, o return o, period;'
}
exports.GetHedgers = function (cb) {
  queryDb(queries.getHedgers(), cb);
};

exports.GetAllDonors = function (cb) {
  queryDb(queries.getAllDonors(), cb);
};

exports.GetAvailableRaces = function(cb) {
  queryDb(queries.getAvailableRaces(), cb);
}