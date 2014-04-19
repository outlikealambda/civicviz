var neo = require('node-neo4j');

var 
  db = new neo('http://localhost:7474'),
  queries = {};

queries.getCommittee = function (name) {
  return 'match (c) where c.name = "Carlisle for Mayor" return c';
};

function queryDb(queryString, params, cb) {
  db.cypherQuery(queryString, params, function(err, result) {
    cb(result);
  });
};

queries.getHedgers = function(params) {
  var q = 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = { title }';
  if (params.county) {
    q += ' and o.county = { county }';
  }
  if (params.district) {
    q += ' and o.district = { district }';
  }
  if (params.period) {
    q += ' and d.in = { period }';
  }
  q += ' and r.in = d.in with donor, count(distinct c) as hedges order by hedges where hedges > 1 with donor match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = { title }';
  if (params.county) {
    q += ' and o.county = { county }';
  }
  if (params.district) {
    q += ' and o.district = { district }';
  }
  if (params.period) {
    q += ' and d.in = { period }';
  }
  q += ' and r.in = d.in with donor, c, count(d) as donations, sum(d.amount) as total order by donor.lastName return donor, c, donations, total';

  return q;
};
queries.getHedgersMeta = function(params) {
  console.log(params);
  var q = 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = { title }';
  if (params.county) {
    q += ' and o.county = { county }';
  }
  if (params.district) {
    q += ' and o.district = { district }';
  }
  if (params.period) {
    q += ' and d.in = { period }';
  }
  q += ' and d.in = r.in with donor, count(distinct c) as hedges order by hedges where hedges > 1 with donor match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = { title }';
  if (params.county) {
    q += ' and o.county = { county }';
  }
  if (params.district) {
    q += ' and o.district = { district }';
  }
  if (params.period) {
    q += ' and d.in = { period }';
  }
  q += ' and d.in = r.in with c, count(distinct donor) as donors, count(d) as donations, sum(d.amount) as total order by total return c, donors, donations, total';

  return q;
};

queries.getAllDonors = function(params) {
  var q = 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = { title }'
  if (params.county) {
    q += ' and o.county = { county }';
  }
  if (params.district) {
    q += ' and o.district = { district }';
  }
  if (params.period) {
   q += ' and d.in = { period }';
  }
  q += ' and r.in = d.in with donor, c, count(d) as donations, sum(d.amount) as total order by donor.lastName return donor, c, donations, total';

  return q;
};

queries.getAllDonorsMeta = function(params) {
  var q = 'match (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office) where o.title = { title }'
  if (params.county) {
    q += ' and o.county = { county }';
  }
  if (params.district) {
    q += ' and o.district = { district }';
  }
  if (params.period) {
   q += ' and d.in = { period }';
  }
  q += ' and r.in = d.in with c, count(distinct donor) as donors, count(d) as donations, sum(d.amount) as total order by total return c, donors, donations, total';

  return q;
};

queries.getAvailableRaces = function() {
  return 'match (o:Office)-[r:`ran for`]-(c) with distinct r.in as period, o return o, period';
}

queries.getDonorDonations = function() {
  return 'match (donor:Person)-[d:`contributed to`]->(c:Committee) where donor.personId = { personId } with donor, c, d order by c.regNo return donor, c, d';
}
queries.getDonorDonationsMeta = function() {
  return 'match (donor:Person)-[d:`contributed to`]->(c:Committee) where donor.personId = { personId } with donor, c, sum(d.amount) as donations order by donations return donor, c, donations';
}

exports.GetHedgers = function (params, cb) {
  queryDb(queries.getHedgers(params), params, cb);
};

exports.GetHedgersMeta = function (params, cb) {
  queryDb(queries.getHedgersMeta(params), params, cb);
};

exports.GetAllDonors = function (params, cb) {
  queryDb(queries.getAllDonors(params), params, cb);
};

exports.GetAllDonorsMeta = function (params, cb) {
  queryDb(queries.getAllDonorsMeta(params), params, cb);
};

exports.GetAvailableRaces = function(cb) {
  queryDb(queries.getAvailableRaces(), {}, cb);
}

exports.GetDonorDonations = function(params, cb) {
  queryDb(queries.getDonorDonations(), params, cb);
}

exports.GetDonorDonationsMeta = function(params, cb) {
  queryDb(queries.getDonorDonationsMeta(), params, cb);
}