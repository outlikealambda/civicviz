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
