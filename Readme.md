### Things To Remember:
Express => Routes
Express => Middlewares

Mongodb => Schemas
Mongodb => Models

MVC => Controller(Node) -> Model(Mongo) -> View(Html)

Mongodb : Database => natours, Model => tours & users

Filters - {$lt, $lte, $gt, $gte, $or, $and}
Projection - {<column_name>: 1} // Only this column will be shown in the output

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
