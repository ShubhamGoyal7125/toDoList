const express = require("express");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(
    "mongodb+srv://shubham:8053889763@shubham.f6jq4.mongodb.net/toDoListDB"
  );

  
  const itemSchema = new mongoose.Schema({
    name: String,
  });

  const Item = mongoose.model("Item", itemSchema);

  const item1 = new Item({
    name: "Welcome to your To Do List!",
  });

  const item2 = new Item({
    name: "Hit + to add new items.",
  });

  const item3 = new Item({
    name: "Hit checkbox to delete an item.",
  });

  const item4 = new Item({
    name: "You can make your own list by adding your list name in the url.",
  });


  const defaultItems = [item1, item2, item3, item4];

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema],
  });

  const List = mongoose.model("List", listSchema);

  app.get("/", function (req, res) {
    Item.find({}, function (err, foundItems) {
      //find() returns an array whereas findOne returns only one document not an array.
      if (err) {
        console.log(err);
      } else if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added some items.");
          }
        });
        res.redirect("/");
      } else {
        console.log(foundItems);
        res.render("list", { ListTitle: "Today", newItem: foundItems });
      }
    });
  });

  app.get("/:titleName", function (req, res) {
    const titleName = _.capitalize(req.params.titleName);
    List.findOne({ name: titleName }, function (err, foundList) {
      if (err) {
        console.log(err);
      } else {
        if (!foundList) {
          const list = new List({
            name: titleName,
            items: defaultItems,
          });
          list.save();
          res.redirect(`/${titleName}`);
        } else {
          res.render("list", {
            ListTitle: foundList.name,
            newItem: foundList.items,
          });
        }
      }
    });
  });

  app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listTitle = req.body.title;
    const item = new Item({
      name: itemName,
    });

    if (listTitle === "Today") {
      item.save();
      Item.findOne({ name: itemName }, function (err, found) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/");
        }
      });
    } else {
      List.findOne({ name: listTitle }, function (err, foundList) {
        if (err) {
          console.log(err);
        } else {
          foundList.items.push(item);
          foundList.save();
          List.findOne({ name: itemName }, function (err, found) {
            if (err) {
              console.log(err);
            } else {
              res.redirect(`/${listTitle}`);
            }
          });
        }
      });
    }
  });

  app.post("/delete", function (req, res) {
    const deleteItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName == "Today") {
      Item.findByIdAndRemove(deleteItemId, function (err) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/");
        }
      });
    } else {
      List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { _id: deleteItemId } } },
        function (err, foundList) {
          if (err) {
            console.log(err);
          } else {
            res.redirect(`/${listName}`);
          }
        }
      );
    }
  });

  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }
  app.listen(port, function () {
    console.log("Server has started successfully.");
  });
}
