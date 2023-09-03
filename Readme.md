### Things To Remember:
Express => Routes &nbsp;
Express => Middlewares  &nbsp;

Mongodb => Schemas &nbsp;
Mongodb => Models &nbsp;

MVC => Controller(Node) -> Model(Mongo) -> View(Html)  &nbsp;

Mongodb : Database => natours, Model => tours & users  &nbsp;

Filters - {$lt, $lte, $gt, $gte, $or, $and}  &nbsp;
Projection - {<column_name>: 1} // Only this column will be shown in the output  &nbsp;

### All Databases - show dbs
Create & Switch Database - use natours
Create Collection - db.createCollection('tours')
Insert One Document - db.tours.insertOne({...})
Insert Many Documents - db.tours.insertMany([{...}, {...}, {...}])
Read Documents - db.tours.find() / db.tours.find({...})
Update Document - db.tours.updateOne({...}, {$set: {<property>: <value>}})
Update Documents - db.tours.updateMany({...}, {$set: [{<property>: <value>}, {<property>: <value>}]})
Delete Document - db.tours.deleteOne({...})
Delete Documents - db.tours.deleteMany({...})
