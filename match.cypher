match
	(o:Office)<-[r1:`ran for`]-(c1:Committee)<-[con1:`contributed to`]-(donor:Person),
	(o)<-[r2:`ran for`]-(c2:Committee)<-[con2:`contributed to`]-(donor),
where
    o.title = "Governor" and c1.name <> c2.name and r1.in = "2008-2010" and r1.in = r2.in and r1.in = con1.in and con1.in = con2.in
return o, r1, c1, con1, donor, con2, c2, r2 

match 
	(c1:Committee)-[r2:`ran for`]->(o:Office)<-[r:`ran for`]-(c2:Committee)
where 
	o.title = "Governor" and r2.in = "2008-2010" and r2.in = r.in
with c1, c2
match 
    (c1)-[con1:`contributed to`]-(donor)-[con2:`contributed to`]->(c2)
where
    con1.in = "2008-2010" and con1.in = con2.in and c1.name <> c2.name
return distinct donor

// get all donors for a race
match
  (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
  o.title = "Governor" and d.in = "2008-2010" and r.in = d.in
with donor, c, count(d) as donations, sum(d.amount) as total order by donor.lastName
return donor, c, donations, total

// sum contributions by committee
match
  (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
  o.title = "Governor" and d.in = "2008-2010" and r.in = d.in
with c, count(distinct donor) as donors, count(d) as donations, sum(d.amount) as total
return c, donors, donations, total

/** 
get all hedging donors 
results: donor, committee, # of donations to that committee
**/
match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	o.title = "Governor" and d.in = "2010-2012" and r.in = d.in
with donor, count(distinct c) as hedges
order by hedges
where
    hedges > 1
with donor
match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	d.in = "2010-2012" and r.in = d.in and o.title = "Governor" 
with donor, c, count(d) as donations order by donor.lastName
return donor, c, donations 

/**
 * returns the total donation amount per committee
 *
 */
match
  (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
  o.title = "Governor" and d.in = "2008-2010" and r.in = d.in
with donor, count(distinct c) as hedges
order by hedges
where
    hedges > 1
with donor
match
  (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
  d.in = "2008-2010" and r.in = d.in and o.title = "Governor" 
with donor, c, count(d) as donations, sum(d.amount) as total order by donor.personId
return donor, c, donations, total 
/**
 * committee totals
 *
 */
match
  (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
  o.title = "Governor" and d.in = "2008-2010" and r.in = d.in
with donor, count(distinct c) as hedges
order by hedges
where
    hedges > 1
with donor
match
  (donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
  d.in = "2008-2010" and r.in = d.in and o.title = "Governor" 
with c, count(distinct donor) as donors, count(d) as donations, sum(d.amount) as total order by total
return c, donors, donations, total 

/** 
get all hedging donors 
results: donor, committee, donation
**/
match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	o.title = "Governor" and d.in = "2010-2012" and r.in = d.in
with donor, count(distinct c) as hedges
order by hedges
where
    hedges > 1
with donor
match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	d.in = "2010-2012" and r.in = d.in and o.title = "Governor" 
with donor, c, d order by donor.lastName
return donor, c, d 

match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	o.title = "Mayor" and d.in = "2010-2012" and r.in = d.in
with c, count(d) as donations order by donations
return c, donations

match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	o.title = "Governor" and d.in = "2010-2012" and r.in = d.in
with donor, count(distinct c) as hedges
order by hedges
where
    hedges > 1
with donor
match
	(donor)-[d:`contributed to`]->(c:Committee)-[r:`ran for`]->(o:Office)
where 
	d.in = "2010-2012" and r.in = d.in and o.title = "Governor" 
with donor, c, count(d) as donations
order by donor.lastName
return donor, c, donations 


// get individual donations for a person, grouped by candidate
match (donor:Person)-[d:`contributed to`]->(c:Committee) where donor.personId = 3683 with donor, c, sum(d.amount) as donation order by donation return donor, c, donation// get individual donations for a person, grouped by candidate

match (donor:Person)-[d:`contributed to`]->(c:Committee) where donor.personId = 3683 return donor, c, d 

// get all people associated with a campaign who are NOT donors
match 
  (c:Committee)-[r]-(e)
where 
  c.regNo = "CC10529"
with c, r, type(r) as rtype, e
where 
  rtype <> "contributed to"
return c, r, rtype, e


// get a summary of donations to a campaign, by year
match 
  (c:Committee)-[r:`contributed to`]-(p:Person) 
where 
  c.regNo = "CC10529" 
with c, type(r) as rtype, r.in as session, sum(r.amount) as total, count(distinct p) as donors 
return c, rtype, session, total, donors