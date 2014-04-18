var neo = require('node-neo4j');

var 
  db = new neo('http://localhost:7474'),
  queries = {};

queries.getCommittee = function (name) {
  return 'match (c) where c.name = "Carlisle for Mayor" return c';
};

queries.getHedgers = function() {
  return 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = "Governor" and d.in = "2008-2010" and r.in = d.in with donor, count(distinct c) as hedges order by hedges where hedges > 1 with donor match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where d.in = "2008-2010" and r.in = d.in and o.title = "Governor" with donor, c, count(d) as donations order by donor.lastName return donor, c, donations';
};

exports.DoSomething = function doSomethingFn(cb) {
  db.cypherQuery(queries.getHedgers(), function(err, result) {
    cb(result);
  });
};