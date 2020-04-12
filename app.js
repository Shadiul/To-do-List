const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + "/date.js");

const app = express();

// const items = ["task 1", "task 2"];
// const workItems = [];

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//Set up default mongoose connection
var mongoDB = 'mongodb+srv://admim-shadiul:PASSWORD@cluster0-dxqs0.mongodb.net/todolistDB';
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your todolist!'
});
const item2 = new Item({
  name: 'Hit the + button to add new item.'
});
const item3 = new Item({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {

  // let day = date.getDay();

  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully saved default items to database');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'Today',
        newListItem: foundItems
      });
    }
  });

});

app.get('/:customListName', function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log('New list created: ' + customListName);
        res.redirect('/' + customListName);
      } else {
        //Show an existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItem: foundList.items
        });
      }
    }
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === 'Today') {
    item.save();
    console.log('Successfully added "' + itemName + '" to "' + listName + '"');
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      console.log('Successfully added "' + itemName + '" to "' + listName + '"');
      res.redirect('/' + listName);
    });
  }

});

app.post('/delete', function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log('Successfully deleted "' + checkedItemId + '" from "' + listName + '"');
        res.redirect('/');
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function (err, foundList) {
      if (!err) {
        console.log('Successfully deleted "' + checkedItemId + '" from "' + listName + '"');
        res.redirect('/' + listName);
      }
    });
  }

});

app.post("/directories", function (req, res) {
  if (req.body.directory === "today") {
    res.redirect("/");
  } else if (req.body.directory === "work") {
    res.redirect("/work");
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});