### Things To Remember:
Express => Routes </br>
Express => Middlewares  

Mongodb => Schemas </br>
Mongodb => Models 

MVC => Controller(Node) -> Model(Mongo) -> View(Html) 

Mongodb : Database => natours, Model => tours & users  

Filters - {$lt, $lte, $gt, $gte, $or, $and} 
Projection - {<column_name>: 1} // Only this column will be shown in the output  

### All Databases - show dbs
Create & Switch Database - use natours </br>
Create Collection - db.createCollection('tours') </br>
Insert One Document - db.tours.insertOne({...}) </br>
Insert Many Documents - db.tours.insertMany([{...}, {...}, {...}]) </br>
Read Documents - db.tours.find() / db.tours.find({...}) </br>
Update Document - db.tours.updateOne({...}, {$set: {<property>: <value>}}) </br>
Update Documents - db.tours.updateMany({...}, {$set: [{<property>: <value>}, {<property>: <value>}]}) </br>
Delete Document - db.tours.deleteOne({...}) </br>
Delete Documents - db.tours.deleteMany({...}) </br>
